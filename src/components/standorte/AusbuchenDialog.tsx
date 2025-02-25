import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  standortId: string;
  warenbestand: any[];
  onSuccess: () => void;
}

export default function AusbuchenDialog({ isOpen, onClose, standortId, warenbestand, onSuccess }: Props) {
  const [selectedArtikel, setSelectedArtikel] = useState('');
  const [selectedLagerort, setSelectedLagerort] = useState('');
  const [menge, setMenge] = useState(1);
  const [referenz, setReferenz] = useState('');

  const artikel = warenbestand.find(a => a.artikel.id === selectedArtikel);
  const verfuegbareMenge = artikel?.lagerorte.get(selectedLagerort) || 0;

  const queryClient = useQueryClient();

  const ausbuchen = useMutation({
    mutationFn: async () => {
      if (!selectedArtikel || !selectedLagerort || !referenz) {
        throw new Error('Bitte alle Felder ausfüllen');
      }

      if (menge > verfuegbareMenge) {
        throw new Error('Nicht genügend Artikel im Lagerort verfügbar');
      }

      // Transaktion starten
      const { error: transactionError } = await supabase.rpc('ausbuchen_artikel', {
        p_standort_id: standortId,
        p_artikel_id: selectedArtikel,
        p_menge: menge,
        p_lagerort: selectedLagerort,
        p_referenz: referenz
      });

      if (transactionError) throw transactionError;
    },
    onMutate: async () => {
      // Optimistische Aktualisierung
      const previousWarenbestand = queryClient.getQueryData(['standort-warenbestand', standortId]);
      
      queryClient.setQueryData(['standort-warenbestand', standortId], (old: any[]) => {
        return old.map(artikel => {
          if (artikel.artikel.id === selectedArtikel) {
            const newLagerorte = new Map(artikel.lagerorte);
            const currentMenge = newLagerorte.get(selectedLagerort) || 0;
            newLagerorte.set(selectedLagerort, currentMenge - menge);
            
            return {
              ...artikel,
              menge: artikel.menge - menge,
              lagerorte: newLagerorte
            };
          }
          return artikel;
        });
      });

      return { previousWarenbestand };
    },
    onError: (error, variables, context) => {
      // Bei Fehler zurückrollen
      if (context?.previousWarenbestand) {
        queryClient.setQueryData(['standort-warenbestand', standortId], context.previousWarenbestand);
      }
      toast.error(error.message || 'Fehler beim Ausbuchen');
    },
    onSuccess: () => {
      toast.success('Artikel erfolgreich ausgebucht');
      onSuccess();
      resetForm();
    }
  });

  const resetForm = () => {
    setSelectedArtikel('');
    setSelectedLagerort('');
    setMenge(1);
    setReferenz('');
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                    Artikel ausbuchen
                  </Dialog.Title>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Artikel</label>
                        <select
                          value={selectedArtikel}
                          onChange={(e) => {
                            setSelectedArtikel(e.target.value);
                            setSelectedLagerort('');
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="">Bitte wählen</option>
                          {warenbestand.map((artikel) => (
                            <option key={artikel.artikel.id} value={artikel.artikel.id}>
                              {artikel.artikel.name} ({artikel.artikel.artikelnummer})
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedArtikel && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Lagerort</label>
                          <select
                            value={selectedLagerort}
                            onChange={(e) => setSelectedLagerort(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          >
                            <option value="">Bitte wählen</option>
                            {Array.from(artikel?.lagerorte.entries() || []).map(([lagerort, menge]) => (
                              <option key={lagerort} value={lagerort}>
                                {lagerort} ({menge} verfügbar)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {selectedLagerort && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Menge</label>
                            <input
                              type="number"
                              min="1"
                              max={verfuegbareMenge}
                              value={menge}
                              onChange={(e) => setMenge(parseInt(e.target.value))}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Referenz</label>
                            <input
                              type="text"
                              value={referenz}
                              onChange={(e) => setReferenz(e.target.value)}
                              placeholder="z.B. Wartung #123"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
                  onClick={() => ausbuchen.mutate()}
                  disabled={!selectedArtikel || !selectedLagerort || !referenz || ausbuchen.isLoading}
                >
                  Ausbuchen
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
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 