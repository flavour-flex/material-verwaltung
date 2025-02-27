import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bestellung, Artikel } from '@/types';
import { AutoComplete } from '@/components/ui/AutoComplete';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';

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
  const [pendingOrders, setPendingOrders] = useState<Bestellung[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Bestellung | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [items, setItems] = useState<WareneingangItem[]>([]);
  const queryClient = useQueryClient();

  // Lade versendete Bestellungen
  useEffect(() => {
    const fetchPendingOrders = async () => {
      console.log('Fetching orders for standort:', standortId);

      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          *,
          artikel:bestellung_artikel(
            id,
            menge,
            versandte_menge,
            artikel:artikel_id(*)
          )
        `)
        .eq('standort_id', standortId)
        .in('status', ['versendet', 'teilweise_versendet']);

      console.log('Fetched orders:', data, 'Error:', error);

      if (!error && data) {
        // Bei Teillieferungen nur die versendeten Mengen anzeigen
        const processedOrders = data.map(order => ({
          ...order,
          artikel: order.artikel.map(pos => ({
            ...pos,
            menge: order.status === 'teilweise_versendet' ? pos.versandte_menge : pos.menge
          }))
        }));
        setPendingOrders(processedOrders);
      } else {
        console.error('Error fetching orders:', error);
      }
    };

    const fetchLocations = async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('location_name')
        .eq('standort_id', standortId);

      if (!error && data) {
        setLocations(data.map(l => l.location_name));
      }
    };

    fetchPendingOrders();
    fetchLocations();
  }, [standortId]);

  const handleOrderSelect = (order: Bestellung) => {
    setSelectedOrder(order);
    setItems(
      order.artikel.map(pos => ({
        ...pos.artikel,
        id: pos.artikel.id,        // Artikel ID
        bestellung_artikel_id: pos.id,  // Bestellung_artikel ID
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

      // Korrigiere die Query-Invalidierung
      queryClient.invalidateQueries({ queryKey: ['bestellungen'] });
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
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium mb-4">Wareneingang</h3>
      
      {!selectedOrder ? (
        <div className="space-y-4">
          <h4 className="font-medium">Versendete Bestellungen</h4>
          {pendingOrders.length === 0 ? (
            <div className="text-gray-500 text-center py-4">
              Keine versendeten Bestellungen vorhanden
            </div>
          ) : (
            pendingOrders.map(order => (
              <div key={order.id} className="border p-4 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div>Bestellung #{order.id}</div>
                    <div className="text-sm text-gray-500">
                      {order.artikel.length} Artikel
                    </div>
                  </div>
                  <button
                    onClick={() => handleOrderSelect(order)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Einbuchen
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <h4 className="font-medium">Bestellung #{selectedOrder.id} einbuchen</h4>
          
          {items.map((item, itemIndex) => (
            <div key={item.id} className="mb-4 p-4 border rounded">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">{item.name}</h4>
                <button
                  type="button"
                  onClick={() => handleSplitItem(itemIndex)}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Aufteilen
                </button>
              </div>
              <p className="text-sm text-gray-500">Gesamtmenge: {item.quantity}</p>
              
              {item.splits.map((split, splitIndex) => (
                <div key={splitIndex} className="mt-2 flex gap-4">
                  <input
                    type="number"
                    value={split.quantity}
                    onChange={(e) => handleQuantityChange(itemIndex, splitIndex, parseInt(e.target.value))}
                    className="border rounded px-2 py-1 w-24"
                    max={item.quantity}
                  />
                  <AutoComplete
                    value={split.location}
                    onChange={(value) => handleLocationChange(itemIndex, splitIndex, value)}
                    suggestions={locations}
                    placeholder="Lagerort"
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          ))}
          
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-gray-600 px-4 py-2 rounded"
            >
              Abbrechen
            </button>
            <button
              onClick={handleEinbuchen}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Einbuchen
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 