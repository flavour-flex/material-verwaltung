import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import type { 
  BestellPosition, 
  Artikel, 
  WareneingangData, 
  BestandsArtikel,
  LagerortPosition 
} from '@/types';

const bestellungSchema = z.object({
  artikel: z.array(z.object({
    artikel_id: z.string().min(1, 'Artikel ist erforderlich'),
    menge: z.number().min(1, 'Menge muss mindestens 1 sein'),
  })).min(1, 'Mindestens ein Artikel ist erforderlich'),
});

type BestellungFormData = z.infer<typeof bestellungSchema>;

interface Props {
  standortId: string;
}

interface SupabaseWareneingang {
  id: string;
  artikel: {
    id: string;
    name: string;
    artikelnummer: string;
    kategorie: string;
  };
  menge: number;
  lagerorte: LagerortPosition[];
  bestellung?: {
    id: string;
    created_at: string;
  };
}

export default function BestellungForm({ standortId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const bestand = new Map<string, BestandsArtikel>();
  
  // Warenbestand laden
  const { data: wareneingaenge = [] } = useQuery<WareneingangData[]>({
    queryKey: ['standort-warenbestand', standortId],
    queryFn: async () => {
      if (!standortId) return [];

      const { data, error } = await supabase
        .from('wareneingang')
        .select(`
          id,
          artikel:artikel_id (
            id,
            name,
            artikelnummer,
            kategorie,
            einheit
          ),
          menge,
          lagerorte,
          bestellung:bestellung_id (
            id,
            created_at
          )
        `)
        .eq('standort_id', standortId);

      if (error) throw error;
      return data || [];
    },
  });

  // Warenbestand berechnen
  if (Array.isArray(wareneingaenge)) {
    wareneingaenge.forEach((eingang) => {
      if (!eingang?.artikel) return;

      const artikelId = eingang.artikel.id;
      const current = bestand.get(artikelId) || {
        artikel: eingang.artikel,
        menge: 0,
        lagerorte: new Map<string, number>()
      };

      current.menge += eingang.menge;

      // Lagerorte verarbeiten
      if (Array.isArray(eingang.lagerorte)) {
        eingang.lagerorte.forEach((lo) => {
          const aktuellerBestand = current.lagerorte.get(lo.lagerort) || 0;
          current.lagerorte.set(lo.lagerort, aktuellerBestand + lo.menge);
        });
      }

      bestand.set(artikelId, current);
    });
  }

  // Alle verfügbaren Artikel laden
  const { data: artikel } = useQuery<Artikel[]>({
    queryKey: ['artikel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artikel')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  // Hauptlager E-Mail laden
  const { data: einstellungen } = useQuery({
    queryKey: ['einstellungen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('einstellungen')
        .select('hauptlager_email')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { register, control, handleSubmit, formState: { errors } } = useForm<BestellungFormData>({
    resolver: zodResolver(bestellungSchema),
    defaultValues: {
      artikel: [{ artikel_id: '', menge: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'artikel',
  });

  // Bestellung erstellen
  const createBestellung = useMutation({
    mutationFn: async (data: BestellungFormData) => {
      try {
        // Erst die Bestellung erstellen
        const { data: bestellung, error: bestellungError } = await supabase
          .from('bestellungen')
          .insert({
            standort_id: standortId,
            status: 'offen'
          })
          .select()
          .single();

        if (bestellungError) throw bestellungError;

        // Dann die Bestellpositionen erstellen
        const bestellungArtikel = data.artikel.map(position => ({
          bestellung_id: bestellung.id,
          artikel_id: position.artikel_id,
          menge: position.menge,
          versandte_menge: 0
        }));

        const { error: positionenError } = await supabase
          .from('bestellung_artikel')
          .insert(bestellungArtikel);

        if (positionenError) throw positionenError;
      } catch (error: any) {
        console.error('Detailed error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bestellungen'] });
      toast.success('Bestellung erfolgreich erstellt');
      router.push('/bestellungen');
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
      console.error('Mutation error:', error);
    }
  });

  const onSubmit = handleSubmit((data: BestellungFormData) => {
    return createBestellung.mutateAsync(data);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Aktueller Warenbestand */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Aktueller Warenbestand
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikel</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Gesamtmenge</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lagerorte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {Array.from(bestand.values()).map((artikel) => (
                  <tr key={artikel.artikel.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {artikel.artikel.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {artikel.artikel.artikelnummer}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                      {artikel.menge}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {Array.from(artikel.lagerorte.entries()).map(([lagerort, menge]) => (
                        <div key={lagerort} className="flex justify-between">
                          <span>{lagerort}:</span>
                          <span className="ml-2">{menge}</span>
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
                {(!wareneingaenge || wareneingaenge.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 text-center">
                      Kein Warenbestand vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bestellpositionen */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Bestellung
          </h3>
          
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 mb-6">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">
                  Artikel
                </label>
                <div className="mt-1">
                  <select
                    {...register(`artikel.${index}.artikel_id`)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="">Bitte wählen</option>
                    {artikel?.map((art) => (
                      <option key={art.id} value={art.id}>
                        {art.name} ({art.artikelnummer})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Menge
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    min="1"
                    {...register(`artikel.${index}.menge`, { valueAsNumber: true })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="sm:col-span-1 flex items-end">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Entfernen
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => append({ artikel_id: '', menge: 1 })}
            className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Position hinzufügen
          </button>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={createBestellung.isPending}
          className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {createBestellung.isPending ? 'Wird erstellt...' : 'Bestellung aufgeben'}
        </button>
      </div>
    </form>
  );
} 