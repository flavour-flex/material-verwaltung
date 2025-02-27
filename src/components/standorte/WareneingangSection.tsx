import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { 
  BestellungType,  // Umbenennung von Bestellung zu BestellungType
  Artikel, 
  BestandsArtikel, 
  WareneingangData 
} from '@/types';
import { AutoComplete } from '@/components/ui/AutoComplete';
import { toast } from 'react-hot-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { 
  transformWareneingang, 
  transformBestellung, 
  transformToBestandsArtikel 
} from '@/lib/transformers';
import { format } from 'date-fns';

interface WareneingangSectionProps {
  standortId: string;
  onWareneingangComplete: () => void;
}

interface WareneingangItem extends Artikel {
  quantity: number;
  splits: {
    quantity: number;
    location: string;
  }[];
}

interface BestellungArtikel {
  id: string;
  artikel_id: string;
  menge: number;
  versandte_menge: number;
  artikel: {
    id: string;
    name: string;
    artikelnummer: string;
  };
}

interface Bestellung {
  id: string;
  artikel: BestellungArtikel[];
  // ... andere Felder
}

export default function WareneingangSection({ standortId, onWareneingangComplete }: WareneingangSectionProps) {
  const [pendingOrders, setPendingOrders] = useState<BestellungType[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<BestellungType | null>(null);
  const [items, setItems] = useState<WareneingangItem[]>([]);
  const queryClient = useQueryClient();
  const bestand = new Map<string, BestandsArtikel>();

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
            kategorie
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
      return (data || []).map(transformWareneingang);
    },
  });

  // Warenbestand berechnen
  if (Array.isArray(wareneingaenge)) {
    wareneingaenge.forEach((eingang) => {
      if (!eingang?.artikel) return;

      const current = bestand.get(eingang.artikel.id) || {
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

      bestand.set(eingang.artikel.id, current);
    });
  }

  // Lade versendete Bestellungen mit Artikeln
  useEffect(() => {
    const fetchPendingOrders = async () => {
      console.log('Fetching orders for standort:', standortId);

      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          *,
          artikel:bestellung_artikel(
            id,
            artikel_id,
            menge,
            versandte_menge,
            artikel:artikel_id(
              id,
              name,
              artikelnummer,
              kategorie
            )
          )
        `)
        .eq('standort_id', standortId)
        .in('status', ['versendet', 'teilweise_versendet']);

      console.log('Fetched orders:', data, 'Error:', error);

      if (!error && data) {
        const processedOrders = data.map(transformBestellung);
        setPendingOrders(processedOrders);
      } else {
        console.error('Error fetching orders:', error);
      }
    };

    fetchPendingOrders();
  }, [standortId]);

  const handleOrderSelect = (order: BestellungType) => {
    setSelectedOrder(order);
    setItems(
      order.artikel.map(pos => ({
        ...pos.artikel,
        id: pos.artikel.id,
        bestellung_artikel_id: pos.id,
        quantity: pos.menge,
        splits: [
          { 
            location: '', 
            quantity: pos.menge 
          }
        ]
      }))
    );
  };

  const handleSplitItem = (itemIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = newItems[itemIndex];
      
      // Wenn bereits 2 Splits vorhanden sind (original + zusätzlich), nichts tun
      if (item.splits.length >= 2) {
        toast('Maximal zwei Lagerorte möglich', {
          icon: 'ℹ️'
        });
        return prev;
      }

      // Aktuelle Menge des ersten Splits
      const currentQuantity = item.splits[0].quantity;
      
      // Teile die Menge gleichmäßig auf
      const halfQuantity = Math.floor(currentQuantity / 2);
      
      // Aktualisiere den ersten Split
      item.splits[0].quantity = halfQuantity;
      
      // Füge einen neuen Split mit der restlichen Menge hinzu
      item.splits.push({
        location: '',
        quantity: currentQuantity - halfQuantity // Rest der Menge
      });
      
      return newItems;
    });
  };

  const handleQuantityChange = (itemIndex: number, splitIndex: number, value: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = newItems[itemIndex];
      item.splits[splitIndex].quantity = value;
      return newItems;
    });
  };

  const handleLocationChange = (itemIndex: number, splitIndex: number, value: string) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = newItems[itemIndex];
      item.splits[splitIndex].location = value;
      return newItems;
    });
  };

  // Validiere die Eingaben
  const validateSplits = (item: WareneingangItem) => {
    const totalSplit = item.splits.reduce((sum, split) => sum + (Number(split.quantity) || 0), 0);
    return totalSplit === item.quantity;
  };

  const handleEinbuchen = async () => {
    if (!selectedOrder) return;

    try {
      // Validiere Mengen und Lagerorte
      for (const item of items) {
        // Prüfe ob alle Splits gültige Werte haben
        const hasInvalidSplits = item.splits.some(split => 
          !split.location || 
          typeof split.quantity !== 'number' || 
          isNaN(split.quantity) || 
          split.quantity <= 0
        );

        if (hasInvalidSplits) {
          toast.error(`Bitte geben Sie gültige Mengen und Lagerorte für ${item.name} ein`);
          return;
        }

        // Prüfe ob die Summe der Splits korrekt ist
        if (!validateSplits(item)) {
          toast.error(`Die Summe der aufgeteilten Mengen muss der Gesamtmenge entsprechen bei ${item.name}`);
          return;
        }
      }

      // Für jeden Artikel und Split einen Wareneingang erstellen
      for (const item of items) {
        for (const split of item.splits) {
          const { error: wareneingangError } = await supabase
            .from('wareneingang')
            .insert({
              bestellung_id: selectedOrder.id,  // Bestellungs-ID
              standort_id: standortId,
              artikel_id: item.id,              // Artikel-ID
              menge: split.quantity,
              lagerorte: [{ 
                lagerort: split.location, 
                menge: split.quantity 
              }]
            });

          if (wareneingangError) {
            console.error('Wareneingang error:', wareneingangError, {
              bestellung_id: selectedOrder.id,
              artikel_id: item.id,
              menge: split.quantity
            });
            throw wareneingangError;
          }
        }
      }

      // Bestellstatus aktualisieren
      const { error: bestellungError } = await supabase
        .from('bestellungen')
        .update({ status: 'eingetroffen' })
        .eq('id', selectedOrder.id);

      if (bestellungError) throw bestellungError;

      // Queries invalidieren und sofort neu laden
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bestellungen'] }),
        queryClient.invalidateQueries({ 
          queryKey: ['standort-warenbestand', standortId],
          refetchType: 'active'
        })
      ]);

      // Explizites Neuladen der Warenbestand-Query
      await queryClient.refetchQueries({ 
        queryKey: ['standort-warenbestand', standortId],
        type: 'active'
      });

      toast.success('Wareneingang erfolgreich gebucht');
      setPendingOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      onWareneingangComplete();
      setSelectedOrder(null);
      setItems([]);

    } catch (error) {
      console.error('Einbuchen error:', error);
      toast.error('Fehler beim Einbuchen der Ware');
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          Wareneingang
        </h3>

        {/* Bestellungsauswahl */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Versendete Bestellung auswählen
          </label>
          <select
            value={selectedOrder?.id || ''}
            onChange={(e) => {
              const order = pendingOrders.find(o => o.id === e.target.value);
              if (order) handleOrderSelect(order);
            }}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">Bitte wählen</option>
            {pendingOrders.map((order) => (
              <option key={order.id} value={order.id}>
                Bestellung vom {format(new Date(order.created_at), 'dd.MM.yyyy')}
                {' - '}
                {order.artikel.length} Artikel
              </option>
            ))}
          </select>
        </div>

        {/* Artikel der ausgewählten Bestellung */}
        {selectedOrder && (
          <>
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Artikel in dieser Bestellung:</h4>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h5 className="font-medium">{item.name}</h5>
                        <p className="text-sm text-gray-500">Art.Nr.: {item.artikelnummer}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        Menge: {item.quantity}
                      </div>
                    </div>

                    {/* Lagerort-Splits */}
                    {item.splits.map((split, splitIndex) => (
                      <div key={splitIndex} className="flex gap-4 mt-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={split.location}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].splits[splitIndex].location = e.target.value;
                              setItems(newItems);
                            }}
                            placeholder="Lagerort eingeben"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={split.quantity}
                            onChange={(e) => {
                              const newItems = [...items];
                              newItems[index].splits[splitIndex].quantity = parseInt(e.target.value);
                              setItems(newItems);
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Button zum Hinzufügen weiterer Splits */}
                    <button
                      type="button"
                      onClick={() => {
                        const newItems = [...items];
                        newItems[index].splits.push({
                          location: '',
                          quantity: 0
                        });
                        setItems(newItems);
                      }}
                      className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                    >
                      Weiteren Lagerort hinzufügen
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Einbuchen Button */}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={handleEinbuchen}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Wareneingang buchen
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 