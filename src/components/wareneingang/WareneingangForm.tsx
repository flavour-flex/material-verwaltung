import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BestellungType, WareneingangPosition } from '@/types';

const wareneingangSchema = z.object({
  artikel: z.array(z.object({
    artikel_id: z.string(),
    menge: z.number().min(1),
    lagerorte: z.array(z.object({
      lagerort: z.string().min(1, 'Lagerort ist erforderlich'),
      menge: z.number().min(1, 'Menge muss mindestens 1 sein'),
    })),
  })),
});

type WareneingangFormData = z.infer<typeof wareneingangSchema>;

interface Props {
  bestellung: BestellungType;
  onSubmit: (data: WareneingangFormData) => Promise<void>;
}

export default function WareneingangForm({ bestellung, onSubmit }: Props) {
  const { register, control, handleSubmit, formState: { errors } } = useForm<WareneingangFormData>({
    resolver: zodResolver(wareneingangSchema),
    defaultValues: {
      artikel: bestellung.artikel.map(pos => ({
        artikel_id: pos.artikel_id,
        menge: pos.menge,
        lagerorte: [{ lagerort: '', menge: pos.menge }],
      })),
    },
  });

  const { data: lagerorte } = useQuery({
    queryKey: ['lagerorte', bestellung.standort_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wareneingang')
        .select('artikel')
        .eq('standort_id', bestellung.standort_id);
      
      if (error) throw error;
      
      // Extrahiere unique Lagerorte aus allen Wareneingängen
      const allLagerorte = new Set<string>();
      data.forEach(we => {
        we.artikel.forEach((pos: WareneingangPosition) => {
          pos.lagerorte.forEach(lo => allLagerorte.add(lo.lagerort));
        });
      });
      
      return Array.from(allLagerorte);
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {bestellung.artikel.map((artikel, artikelIndex) => (
        <div key={artikel.artikel_id} className="border-t pt-4">
          <h3 className="text-lg font-medium">Artikel {artikelIndex + 1}</h3>
          
          <div className="mt-4 space-y-4">
            {/* Lagerorte für diesen Artikel */}
            {fields[artikelIndex].lagerorte.map((lagerort, lagerortIndex) => (
              <div key={lagerort.id} className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Lagerort
                  </label>
                  <input
                    type="text"
                    list={`lagerorte-${artikelIndex}`}
                    {...register(`artikel.${artikelIndex}.lagerorte.${lagerortIndex}.lagerort`)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <datalist id={`lagerorte-${artikelIndex}`}>
                    {lagerorte?.map(ort => (
                      <option key={ort} value={ort} />
                    ))}
                  </datalist>
                </div>

                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700">
                    Menge
                  </label>
                  <input
                    type="number"
                    {...register(`artikel.${artikelIndex}.lagerorte.${lagerortIndex}.menge`, {
                      valueAsNumber: true,
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Wareneingang buchen
      </button>
    </form>
  );
} 