import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useState } from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';

export default function HauptlagerPage() {
  const queryClient = useQueryClient();
  const [selectedBestellung, setSelectedBestellung] = useState<string | null>(null);

  const { data: bestellungen, isLoading } = useQuery({
    queryKey: ['bestellungen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          *,
          standort:standort_id (name),
          artikel:bestellung_artikel(
            menge,
            artikel:artikel_id(
              name,
              artikelnummer
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'versendet' | 'eingetroffen' | 'storniert' }) => {
      const { error } = await supabase
        .from('bestellungen')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status aktualisiert');
      queryClient.invalidateQueries(['bestellungen']);
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des Status');
      console.error('Update error:', error);
    },
  });

  const handlePrint = (bestellung: any) => {
    // Öffne neues Fenster für die Pickliste
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pickliste - Bestellung #${bestellung.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { font-size: 24px; margin-bottom: 20px; }
            .info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f3f4f6; }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button onclick="window.print()">Drucken</button>
            <hr>
          </div>
          <h1>Pickliste - Bestellung #${bestellung.id}</h1>
          <div class="info">
            <p><strong>Standort:</strong> ${bestellung.standort.name}</p>
            <p><strong>Datum:</strong> ${format(new Date(bestellung.created_at), 'dd.MM.yyyy', { locale: de })}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Artikel</th>
                <th>Artikelnummer</th>
                <th>Menge</th>
                <th>Geprüft</th>
              </tr>
            </thead>
            <tbody>
              ${bestellung.artikel.map((pos: any) => `
                <tr>
                  <td>${pos.artikel.name}</td>
                  <td>${pos.artikel.artikelnummer}</td>
                  <td>${pos.menge}</td>
                  <td style="width: 100px;">□</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mt-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Datum</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Standort</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artikel</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {bestellungen?.map((bestellung) => (
                  <tr key={bestellung.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {format(new Date(bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {bestellung.standort.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        bestellung.status === 'offen' ? 'bg-yellow-100 text-yellow-800' :
                        bestellung.status === 'versendet' ? 'bg-blue-100 text-blue-800' :
                        bestellung.status === 'storniert' ? 'bg-red-100 text-red-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {bestellung.status}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedBestellung(
                          selectedBestellung === bestellung.id ? null : bestellung.id
                        )}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {bestellung.artikel.length} Artikel anzeigen
                      </button>
                      {selectedBestellung === bestellung.id && (
                        <div className="mt-2">
                          <ul className="list-disc pl-5 space-y-1">
                            {bestellung.artikel.map((pos: any, idx: number) => (
                              <li key={idx}>
                                {pos.menge}x {pos.artikel.name} ({pos.artikel.artikelnummer})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handlePrint(bestellung)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Pickliste drucken"
                        >
                          <PrinterIcon className="h-5 w-5" />
                        </button>
                        {bestellung.status === 'offen' && (
                          <>
                            <button
                              onClick={() => updateStatus.mutate({ 
                                id: bestellung.id, 
                                status: 'versendet' 
                              })}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              Als versendet markieren
                            </button>
                            <button
                              onClick={() => updateStatus.mutate({ 
                                id: bestellung.id, 
                                status: 'storniert' 
                              })}
                              className="text-red-600 hover:text-red-900"
                            >
                              Stornieren
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 