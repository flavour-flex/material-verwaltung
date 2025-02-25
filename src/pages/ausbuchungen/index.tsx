import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Ausbuchung {
  id: string;
  standort_id: string;
  artikel_id: string;
  menge: number;
  lagerort: string;
  referenz: string;
  created_at: string;
  standort: {
    name: string;
  };
  artikel: {
    name: string;
    artikelnummer: string;
  };
}

export default function AusbuchungenPage() {
  const { data: ausbuchungen, isLoading, error } = useQuery<Ausbuchung[]>({
    queryKey: ['ausbuchungen'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('warenausbuchung')
          .select(`
            *,
            standort:standort_id(name),
            artikel:artikel_id(name, artikelnummer)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (!data) return [];
        
        return data;
      } catch (err) {
        console.error('Fehler beim Laden der Ausbuchungen:', err);
        throw err;
      }
    },
  });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <Layout>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <h3 className="text-sm font-medium text-red-800">
              Fehler beim Laden der Ausbuchungen
            </h3>
          </div>
        </div>
      </Layout>
    );
  }

  // Gruppiere Ausbuchungen nach Referenz
  const grouped = (ausbuchungen || []).reduce((acc, curr) => {
    if (!acc[curr.referenz]) {
      acc[curr.referenz] = [];
    }
    acc[curr.referenz].push(curr);
    return acc;
  }, {} as Record<string, Ausbuchung[]>);

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl font-semibold text-gray-900">Ausbuchungen</h1>
        
        {Object.entries(grouped).length === 0 ? (
          <div className="mt-8 text-center text-gray-500">
            Keine Ausbuchungen vorhanden
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {Object.entries(grouped).map(([referenz, items]) => (
              <div key={referenz} className="bg-white shadow sm:rounded-lg overflow-hidden">
                <div className="px-4 py-5 sm:px-6 bg-gray-50">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {referenz}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {format(new Date(items[0].created_at), 'dd.MM.yyyy', { locale: de })}
                  </p>
                </div>
                <div className="border-t border-gray-200">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artikel</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Standort</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Lagerort</th>
                        <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Menge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {item.artikel.name} ({item.artikel.artikelnummer})
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {item.standort.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {item.lagerort}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                            {item.menge}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 