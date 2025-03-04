import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface WareneingangProps {
  standortId: string;
  onSuccess?: () => void;
}

export default function Wareneingang({ standortId, onSuccess }: WareneingangProps) {
  const [selectedBestellung, setSelectedBestellung] = useState<string | null>(null);

  // Offene Bestellungen laden
  const { data: offeneBestellungen } = useQuery({
    queryKey: ['offene-bestellungen', standortId],
    queryFn: async () => {
      console.log('Fetching orders for standort:', standortId); // Debug-Log
      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          id,
          created_at,
          artikel:bestellung_artikel(
            id,
            artikel_id,
            artikel:artikel_id(name),
            menge,
            versandte_menge
          )
        `)
        .eq('standort_id', standortId)
        .eq('status', ['offen', 'teilweise_versendet'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error); // Debug-Log
        throw error;
      }
      console.log('Fetched orders:', data); // Debug-Log
      return data;
    },
    enabled: !!standortId // Wichtig: Query nur ausführen wenn standortId vorhanden
  });

  // Wareneingang buchen
  const bucheMutation = useMutation({
    mutationFn: async ({ bestellungId, artikel }: { bestellungId: string, artikel: any[] }) => {
      // Alle Artikel der Bestellung durchgehen
      for (const item of artikel) {
        const eingangsMenge = (document.getElementById(`menge-${item.id}`) as HTMLInputElement)?.value;
        if (eingangsMenge && Number(eingangsMenge) > 0) {
          const { error } = await supabase.rpc('buche_wareneingang', {
            p_bestellung_id: bestellungId,
            p_artikel_id: item.artikel_id,
            p_menge: Number(eingangsMenge)
          });
          
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      toast.success('Wareneingang erfolgreich gebucht');
      setSelectedBestellung(null);
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Buchungsfehler:', error);
      toast.error('Fehler beim Buchen des Wareneingangs');
    }
  });

  if (!offeneBestellungen?.length) {
    console.log('Keine Bestellungen gefunden:', {
      standortId,
      queryResult: offeneBestellungen
    });
    return (
      <div className="text-center py-6 text-gray-500">
        Keine offenen Bestellungen vorhanden
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {offeneBestellungen.map((bestellung) => (
          <div 
            key={bestellung.id} 
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Bestellung vom {format(new Date(bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
              </h3>
              <button
                onClick={() => setSelectedBestellung(
                  selectedBestellung === bestellung.id ? null : bestellung.id
                )}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                {selectedBestellung === bestellung.id ? 'Schließen' : 'Wareneingang buchen'}
              </button>
            </div>

            {selectedBestellung === bestellung.id && (
              <div className="mt-4">
                <div className="space-y-4">
                  {bestellung.artikel.map((artikel) => (
                    <div key={artikel.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{artikel.artikel.name}</span>
                        <span className="text-gray-500 ml-2">
                          (Bestellt: {artikel.menge}, Bereits geliefert: {artikel.versandte_menge || 0})
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          id={`menge-${artikel.id}`}
                          min="0"
                          max={artikel.menge - (artikel.versandte_menge || 0)}
                          defaultValue="0"
                          className="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                        <span className="text-sm text-gray-500">Stück</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => bucheMutation.mutate({
                      bestellungId: bestellung.id,
                      artikel: bestellung.artikel
                    })}
                    disabled={bucheMutation.isLoading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {bucheMutation.isLoading ? 'Wird gebucht...' : 'Wareneingang buchen'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 