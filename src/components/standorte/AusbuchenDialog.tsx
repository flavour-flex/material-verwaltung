import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { BestandsArtikel } from '@/types';
import { TrashIcon } from '@heroicons/react/24/outline';

interface AusbuchPosition {
  artikel_id: string;
  lagerort: string;
  menge: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  standortId: string;
  warenbestand: {
    verbrauchsmaterial: BestandsArtikel[];
    bueromaterial: BestandsArtikel[];
  };
  onSuccess: () => void;
}

export default function AusbuchenDialog({ isOpen, onClose, standortId, warenbestand, onSuccess }: Props) {
  const [referenz, setReferenz] = useState('');
  const [positionen, setPositionen] = useState<AusbuchPosition[]>([]);
  const [currentArtikel, setCurrentArtikel] = useState('');
  const [currentLagerort, setCurrentLagerort] = useState('');
  const [currentMenge, setCurrentMenge] = useState<number>(1);

  const queryClient = useQueryClient();

  // Alle verfügbaren Artikel
  const alleArtikel = [
    ...(warenbestand?.verbrauchsmaterial || []),
    ...(warenbestand?.bueromaterial || [])
  ];

  // Finde den aktuell ausgewählten Artikel
  const selectedArtikel = alleArtikel.find(a => a.artikel.id === currentArtikel);
  
  // Verfügbare Menge für den ausgewählten Lagerort
  const verfuegbareMenge = selectedArtikel?.lagerorte?.find(l => l.lagerort === currentLagerort)?.menge || 0;

  // Position hinzufügen
  const addPosition = () => {
    if (!selectedArtikel || !currentLagerort || currentMenge <= 0) return;

    setPositionen([
      ...positionen,
      {
        artikel_id: currentArtikel,
        lagerort: currentLagerort,
        menge: currentMenge
      }
    ]);

    // Felder zurücksetzen
    setCurrentArtikel('');
    setCurrentLagerort('');
    setCurrentMenge(1);
  };

  // Position entfernen
  const removePosition = (index: number) => {
    setPositionen(positionen.filter((_, i) => i !== index));
  };

  // Ausbuchen-Mutation
  const ausbuchen = useMutation({
    mutationFn: async () => {
      if (positionen.length === 0) {
        throw new Error('Keine Positionen zum Ausbuchen');
      }

      // Alle Ausbuchungen in einer Transaktion durchführen
      const { error } = await supabase.from('ausbuchungen').insert(
        positionen.map(pos => ({
          standort_id: standortId,
          artikel_id: pos.artikel_id,
          menge: pos.menge,
          lagerort: pos.lagerort,
          referenz: referenz.trim(),
          storniert: false
        }))
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['standort-warenbestand', standortId]);
      onSuccess();
      onClose();
      // Alles zurücksetzen
      setPositionen([]);
      setReferenz('');
      setCurrentArtikel('');
      setCurrentLagerort('');
      setCurrentMenge(1);
      toast.success('Artikel erfolgreich ausgebucht');
    },
    onError: (error: any) => {
      console.error('Ausbuchung error:', error);
      toast.error(`Fehler beim Ausbuchen: ${error.message}`);
    }
  });

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded bg-white p-6">
          <Dialog.Title className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Artikel ausbuchen
          </Dialog.Title>

          {/* Referenz-Eingabe */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Referenz</label>
            <input
              type="text"
              value={referenz}
              onChange={(e) => setReferenz(e.target.value)}
              placeholder="z.B. Kursnummer oder Veranstaltung"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          {/* Neue Position hinzufügen */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Artikel</label>
              <select
                value={currentArtikel}
                onChange={(e) => {
                  setCurrentArtikel(e.target.value);
                  setCurrentLagerort('');
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Bitte wählen</option>
                {alleArtikel.map((artikel) => (
                  <option key={artikel.artikel.id} value={artikel.artikel.id}>
                    {artikel.artikel.name} (Gesamt: {artikel.menge})
                  </option>
                ))}
              </select>
            </div>

            {currentArtikel && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Lagerort</label>
                <select
                  value={currentLagerort}
                  onChange={(e) => setCurrentLagerort(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">Bitte wählen</option>
                  {selectedArtikel?.lagerorte.map((lo) => (
                    <option key={lo.lagerort} value={lo.lagerort}>
                      {lo.lagerort} (Verfügbar: {lo.menge})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentLagerort && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Menge</label>
                <input
                  type="number"
                  min="1"
                  max={verfuegbareMenge}
                  value={currentMenge}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setCurrentMenge(Math.min(value, verfuegbareMenge));
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>
            )}

            <button
              type="button"
              onClick={addPosition}
              disabled={!currentArtikel || !currentLagerort || currentMenge <= 0}
              className="mt-4 w-full rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Position hinzufügen
            </button>
          </div>

          {/* Liste der Positionen */}
          {positionen.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Auszubuchende Positionen</h4>
              <div className="space-y-2">
                {positionen.map((pos, index) => {
                  const artikel = alleArtikel.find(a => a.artikel.id === pos.artikel_id);
                  return (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{artikel?.artikel.name}</div>
                        <div className="text-sm text-gray-500">
                          {pos.menge} Stück aus {pos.lagerort}
                        </div>
                      </div>
                      <button
                        onClick={() => removePosition(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aktions-Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={() => ausbuchen.mutate()}
              disabled={positionen.length === 0 || !referenz.trim() || ausbuchen.isPending}
              className="rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {ausbuchen.isPending ? 'Wird ausgebucht...' : 'Alle Positionen ausbuchen'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 