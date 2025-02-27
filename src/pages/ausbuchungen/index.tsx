import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { PrinterIcon } from '@heroicons/react/24/outline';
import AusbuchungStatistiken from '@/components/ausbuchungen/AusbuchungStatistiken';
import AusbuchungDruck from '@/components/ausbuchungen/AusbuchungDruck';
import ReactDOM from 'react-dom';

interface Ausbuchung {
  id: string;
  standort_id: string;
  artikel_id: string;
  menge: number;
  lagerort: string;
  referenz: string;
  created_at: string;
  storniert: boolean;
  standort: {
    name: string;
  };
  artikel: {
    name: string;
    artikelnummer: string;
    einheit: string;
  };
}

interface AusbuchungGruppe {
  referenz: string;
  created_at: string;
  standort: {
    name: string;
  };
  positionen: Ausbuchung[];
}

export default function AusbuchungenPage() {
  const queryClient = useQueryClient();
  const [selectedStandort, setSelectedStandort] = useState<string>('');
  const [dateRange, setDateRange] = useState<{start: string; end: string}>({
    start: '',
    end: ''
  });

  // Lade alle Standorte für den Filter
  const { data: standorte } = useQuery({
    queryKey: ['standorte'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standorte')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Lade Ausbuchungen mit Filtern
  const { data: ausbuchungen, isLoading } = useQuery({
    queryKey: ['ausbuchungen', selectedStandort, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('ausbuchungen')
        .select(`
          *,
          standort:standort_id(name),
          artikel:artikel_id(
            name,
            artikelnummer,
            einheit
          )
        `)
        .eq('storniert', false)
        .order('created_at', { ascending: false });

      if (selectedStandort) {
        query = query.eq('standort_id', selectedStandort);
      }

      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }

      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Gruppiere nach Referenz und Datum
      const grouped = (data || []).reduce((acc: { [key: string]: AusbuchungGruppe }, curr: Ausbuchung) => {
        // Erstelle einen eindeutigen Schlüssel aus Referenz und Datum
        const key = `${curr.referenz || 'Ohne Referenz'}_${curr.created_at}`;
        
        if (!acc[key]) {
          // Neue Gruppe erstellen
          acc[key] = {
            referenz: curr.referenz,
            created_at: curr.created_at,
            standort: curr.standort,
            positionen: []
          };
        }
        
        // Position zur bestehenden Gruppe hinzufügen
        acc[key].positionen.push(curr);
        return acc;
      }, {});

      // Sortiere die Gruppen nach Datum (neueste zuerst)
      return Object.values(grouped).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  });

  // Mutation zum Stornieren einer Ausbuchung
  const stornieren = useMutation({
    mutationFn: async (ausbuchung: Ausbuchung) => {
      const { error } = await supabase
        .from('ausbuchungen')
        .update({ storniert: true })
        .eq('id', ausbuchung.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Beide Queries invalidieren
      queryClient.invalidateQueries(['ausbuchungen']);
      queryClient.invalidateQueries(['standort-warenbestand']);
      toast.success('Ausbuchung erfolgreich storniert');
    },
    onError: (error: any) => {
      console.error('Stornierung error:', error);
      toast.error(`Fehler beim Stornieren: ${error.message}`);
    }
  });

  // Druckfunktion
  const druckeAusbuchung = (gruppe: AusbuchungGruppe) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ausbuchung ${gruppe.referenz || 'Ohne Referenz'}</title>
          <link href="/styles/print.css" rel="stylesheet">
        </head>
        <body>
    `);
    
    const printContent = document.createElement('div');
    const druckKomponente = <AusbuchungDruck gruppe={gruppe} />;
    ReactDOM.render(druckKomponente, printContent);
    
    printWindow.document.body.appendChild(printContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Ausbuchungen</h1>
            <p className="mt-2 text-sm text-gray-700">
              Übersicht aller Ausbuchungen mit Filtermöglichkeiten
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Standort</label>
            <select
              value={selectedStandort}
              onChange={(e) => setSelectedStandort(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Alle Standorte</option>
              {standorte?.map((standort) => (
                <option key={standort.id} value={standort.id}>
                  {standort.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Von</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bis</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Ausbuchungen Tabelle */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="mt-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Datum</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Standort</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Referenz</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikel</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {ausbuchungen?.map((gruppe) => (
                    <tr key={`${gruppe.referenz}-${gruppe.created_at}`}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {format(new Date(gruppe.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {gruppe.standort.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 font-medium">
                        {gruppe.referenz || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          {(gruppe.positionen || []).map((position, idx) => (
                            <div key={position.id} className={idx > 0 ? 'border-t pt-1' : ''}>
                              <div className="font-medium">{position.artikel.name}</div>
                              <div className="text-xs text-gray-400 flex justify-between">
                                <span>Art.Nr.: {position.artikel.artikelnummer}</span>
                                <span>{position.menge} {position.artikel.einheit || 'Stück'}</span>
                                <span>aus {position.lagerort}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm space-x-3">
                        <button
                          onClick={() => druckeAusbuchung(gruppe)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <PrinterIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            Promise.all(
                              gruppe.positionen.map(pos => 
                                stornieren.mutateAsync(pos)
                              )
                            );
                          }}
                          disabled={stornieren.isPending}
                          className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                        >
                          Stornieren
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(!ausbuchungen || ausbuchungen.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 text-center">
                        Keine Ausbuchungen gefunden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && (
          <AusbuchungStatistiken ausbuchungen={ausbuchungen || []} />
        )}
      </div>
    </Layout>
  );
} 