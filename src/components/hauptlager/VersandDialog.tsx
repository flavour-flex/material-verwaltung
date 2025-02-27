import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface VersandDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bestellung: {
    id: string;
    artikel: {
      id: string;          // Bestellung_artikel ID
      artikel_id: string;  // Artikel ID
      menge: number;
      artikel: {
        name: string;
        artikelnummer: string;
      };
    }[];
  };
}

export default function VersandDialog({ isOpen, onClose, bestellung }: VersandDialogProps) {
  const queryClient = useQueryClient();
  const [mengen, setMengen] = useState<Record<string, number>>(() => 
    Object.fromEntries(bestellung.artikel.map(pos => [pos.id, pos.menge]))
  );
  const [versandTyp, setVersandTyp] = useState<'vollstaendig' | 'teillieferung'>('vollstaendig');

  const updateBestellung = useMutation({
    mutationFn: async () => {
      const zuVerwendeneMengen = versandTyp === 'vollstaendig' 
        ? Object.fromEntries(bestellung.artikel.map(pos => [pos.id, pos.menge]))
        : mengen;

      // Start a Supabase transaction
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nicht authentifiziert');

      if (versandTyp === 'teillieferung') {
        // Update die Mengen in der bestellung_artikel Tabelle
        for (const pos of bestellung.artikel) {
          const versandteMenge = zuVerwendeneMengen[pos.id];
          
          if (!pos.id) {
            throw new Error(`Keine ID für Artikel ${pos.artikel.name} gefunden`);
          }

          if (versandteMenge < 0 || versandteMenge > pos.menge) {
            throw new Error(`Ungültige Menge für Artikel ${pos.artikel.name}`);
          }

          console.log('Updating bestellung_artikel:', {
            id: pos.id,
            versandteMenge
          });

          const { error: updateError } = await supabase
            .from('bestellung_artikel')
            .update({ 
              versandte_menge: versandteMenge
            })
            .eq('id', pos.id);

          if (updateError) {
            console.error('Update error for artikel:', pos, updateError);
            throw updateError;
          }
        }
      }

      // Update den Bestellstatus
      const { error: bestellungError } = await supabase
        .from('bestellungen')
        .update({ 
          status: versandTyp === 'vollstaendig' ? 'versendet' : 'teilweise_versendet',
          versand_datum: new Date().toISOString(),
          versandte_mengen: zuVerwendeneMengen
        })
        .eq('id', bestellung.id);

      if (bestellungError) throw bestellungError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bestellungen']);
      toast.success(
        versandTyp === 'vollstaendig' 
          ? 'Bestellung als versendet markiert' 
          : 'Teillieferung wurde gespeichert'
      );
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Aktualisieren der Bestellung');
      console.error('Versand error:', error);
    },
  });

  const handleMengeChange = (artikelId: string, menge: number) => {
    setMengen(prev => ({
      ...prev,
      [artikelId]: menge
    }));
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Bestellung versenden
                    </Dialog.Title>
                    
                    <div className="mt-4">
                      <div className="flex justify-center space-x-4">
                        <button
                          type="button"
                          onClick={() => setVersandTyp('vollstaendig')}
                          className={`px-4 py-2 rounded-md ${
                            versandTyp === 'vollstaendig' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Vollständige Lieferung
                        </button>
                        <button
                          type="button"
                          onClick={() => setVersandTyp('teillieferung')}
                          className={`px-4 py-2 rounded-md ${
                            versandTyp === 'teillieferung' 
                              ? 'bg-indigo-600 text-white' 
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          Teillieferung
                        </button>
                      </div>

                      <div className="mt-4">
                        <table className="min-w-full divide-y divide-gray-300">
                          <thead>
                            <tr>
                              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artikel</th>
                              <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Menge</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {bestellung.artikel.map((pos) => (
                              <tr key={pos.id}>
                                <td className="whitespace-nowrap py-4 pl-3 text-sm">
                                  {pos.artikel.name}
                                </td>
                                <td className="whitespace-nowrap py-4 pr-3">
                                  {versandTyp === 'teillieferung' ? (
                                    <input
                                      type="number"
                                      value={mengen[pos.id]}
                                      onChange={(e) => handleMengeChange(pos.id, parseInt(e.target.value))}
                                      min="0"
                                      max={pos.menge}
                                      className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-900">{pos.menge}</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                    onClick={() => updateBestellung.mutate()}
                  >
                    Als versendet markieren
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={onClose}
                  >
                    Abbrechen
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 