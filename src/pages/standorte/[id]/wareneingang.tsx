import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { toast } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function WareneingangPage() {
  const router = useRouter();
  const { id: standortId } = router.query;

  const { data: bestellungen } = useQuery({
    queryKey: ['bestellungen', standortId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          id,
          created_at,
          status,
          bestellung_artikel (
            id,
            artikel_id,
            menge,
            versandte_menge,
            artikel (
              id,
              name,
              artikelnummer
            )
          )
        `)
        .eq('standort_id', standortId)
        .in('status', ['versendet', 'teilweise_versendet'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!standortId
  });

  const createWareneingang = useMutation({
    mutationFn: async (data: WareneingangData) => {
      const bestellung = bestellungen?.find(b => b.id === data.bestellung_id);
      const position = bestellung?.bestellung_artikel.find(a => a.artikel_id === data.artikel_id);
      
      if (!position) {
        throw new Error('Artikel nicht gefunden');
      }

      const maxEinbuchbareMenge = position.versandte_menge || 0;
      
      if (data.menge > maxEinbuchbareMenge) {
        throw new Error(`Es können maximal ${maxEinbuchbareMenge} Stück eingebucht werden`);
      }

      const { data: wareneingang, error } = await supabase
        .from('wareneingang')
        .insert({
          bestellung_id: data.bestellung_id,
          artikel_id: data.artikel_id,
          standort_id: standortId,
          menge: data.menge,
          lagerorte: data.lagerorte
        })
        .select()
        .single();

      if (error) throw error;
      return wareneingang;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bestellungen', standortId]);
      queryClient.invalidateQueries(['standort-warenbestand', standortId]);
      toast.success('Wareneingang wurde erfolgreich gebucht');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Buchen des Wareneingangs');
    }
  });

  const [mengen, setMengen] = useState<Record<string, number>>({});

  const handleMengeChange = (artikelId: string, menge: number) => {
    setMengen(prev => ({
      ...prev,
      [artikelId]: menge
    }));
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        {bestellungen?.map((bestellung) => (
          <div key={bestellung.id} className="mt-8">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Bestellung vom {format(new Date(bestellung.created_at), 'dd.MM.yyyy')}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {bestellung.status === 'teilweise_versendet' ? 'Teillieferung' : 'Vollständig versendet'}
              </span>
            </h3>
            <div className="mt-4">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artikel</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Bestellt</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Versendet</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Einbuchen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bestellung.bestellung_artikel.map((position) => {
                    const isPartialDelivery = position.versandte_menge < position.menge;
                    
                    return (
                      <tr key={position.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {position.artikel.name}
                            {isPartialDelivery && (
                              <ExclamationTriangleIcon 
                                className="ml-2 h-5 w-5 text-yellow-500" 
                                title="Teillieferung"
                              />
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {position.artikel.artikelnummer}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          {position.menge}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          <span className={isPartialDelivery ? 'text-yellow-600 font-medium' : ''}>
                            {position.versandte_menge || 0}
                            {isPartialDelivery && (
                              <span className="ml-1 text-xs">
                                (Teillieferung)
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <input
                              type="number"
                              min="1"
                              max={position.versandte_menge || 0}
                              className="block w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                              onChange={(e) => handleMengeChange(position.artikel_id, parseInt(e.target.value))}
                            />
                            <span className="text-xs text-gray-500">
                              max: {position.versandte_menge}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Info-Box für Teillieferungen */}
              {bestellung.bestellung_artikel.some(pos => pos.versandte_menge < pos.menge) && (
                <div className="mt-4 rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Teillieferung
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Diese Bestellung enthält Teillieferungen. Es wurden weniger Artikel versendet als ursprünglich bestellt.
                          Die maximale Menge zum Einbuchen entspricht der versendeten Menge.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
} 