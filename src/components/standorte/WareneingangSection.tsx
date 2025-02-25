import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bestellung, Artikel } from '@/types';
import { AutoComplete } from '@/components/ui/AutoComplete';
import { toast } from 'react-hot-toast';

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

export default function WareneingangSection({ standortId, onWareneingangComplete }: WareneingangSectionProps) {
  const [pendingOrders, setPendingOrders] = useState<Bestellung[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Bestellung | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [items, setItems] = useState<WareneingangItem[]>([]);

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
            artikel:artikel_id(*)
          )
        `)
        .eq('status', 'versendet')
        .eq('standort_id', standortId);

      console.log('Fetched orders:', data, 'Error:', error);

      if (!error && data) {
        setPendingOrders(data);
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
    setItems(order.artikel.map(bestellungArtikel => ({
      ...bestellungArtikel.artikel,
      quantity: bestellungArtikel.menge,
      splits: [{
        quantity: bestellungArtikel.menge,
        location: ''
      }]
    })));
  };

  const handleSplit = (itemIndex: number) => {
    setItems(prev => {
      const newItems = [...prev];
      const item = newItems[itemIndex];
      item.splits.push({ quantity: 0, location: '' });
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

  const handleEinbuchen = async () => {
    if (!selectedOrder) return;

    try {
      // Validiere Mengen
      for (const item of items) {
        const totalSplit = item.splits.reduce((sum, split) => sum + split.quantity, 0);
        if (totalSplit !== item.quantity) {
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
              bestellung_id: selectedOrder.id,
              standort_id: standortId,
              artikel_id: item.id,
              menge: split.quantity,
              lagerorte: [{ 
                lagerort: split.location, 
                menge: split.quantity 
              }]
            });

          if (wareneingangError) {
            console.error('Wareneingang error:', wareneingangError);
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

      // Erfolgsmeldung
      toast.success('Wareneingang erfolgreich gebucht');
      
      // Aktualisiere die Liste der offenen Bestellungen
      setPendingOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      
      // Benachrichtige Parent über die Änderung
      onWareneingangComplete();
      
      // Reset lokaler State
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
            <div key={item.id} className="border p-4 rounded-md">
              <div className="font-medium mb-2">{item.name}</div>
              <div className="text-sm text-gray-500 mb-4">Gesamtmenge: {item.quantity}</div>
              
              {item.splits.map((split, splitIndex) => (
                <div key={splitIndex} className="flex gap-4 mb-2">
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
              
              <button
                onClick={() => handleSplit(itemIndex)}
                className="text-blue-500 text-sm mt-2"
              >
                Aufteilen
              </button>
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