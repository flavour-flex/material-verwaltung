import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Artikel {
  id: string;
  name: string;
  artikelnummer: string;
  beschreibung: string | null;
  kategorie: string;
}

interface HardwareArtikel extends Artikel {
  hardware: {
    id: string;
    artikel_id: string;
    serviceintervall_monate: number;
    wechselintervall_jahre: number;
    verantwortlicher: {
      name: string;
      email: string;
      telefon: string;
    };
  };
}

export default function ArtikelPage() {
  const { data: hardware = [], isLoading: hardwareLoading } = useQuery<HardwareArtikel[]>({
    queryKey: ['artikel', 'hardware'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware')
        .select(`
          id,
          artikel_id,
          serviceintervall_monate,
          wechselintervall_jahre,
          verantwortlicher,
          artikel:artikel_id (
            id,
            name,
            artikelnummer,
            beschreibung,
            kategorie
          )
        `);
      
      if (error) {
        console.error('Fehler beim Laden der Hardware:', error);
        throw error;
      }

      console.log('Rohdaten aus der DB:', data);

      // Transformiere die Daten in das gewünschte Format
      const transformedData = data?.map(item => ({
        ...item.artikel,
        hardware: {
          id: item.id,
          artikel_id: item.artikel_id,
          serviceintervall_monate: item.serviceintervall_monate,
          wechselintervall_jahre: item.wechselintervall_jahre,
          verantwortlicher: item.verantwortlicher
        }
      })).filter(item => item.artikel !== null);

      console.log('Transformierte Daten:', transformedData);
      
      return transformedData || [];
    },
  });

  const { data: verbrauchsmaterial = [], isLoading: verbrauchsmaterialLoading } = useQuery<Artikel[]>({
    queryKey: ['artikel', 'verbrauchsmaterial'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artikel')
        .select('*')
        .eq('kategorie', 'Verbrauchsmaterial')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  if (hardwareLoading || verbrauchsmaterialLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-xl font-semibold text-gray-900">Artikel</h1>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/artikel/neu"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Neuer Artikel
            </Link>
          </div>
        </div>

        {/* Hardware-Tabelle */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Hardware</h2>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service-Intervall</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Wechsel-Intervall</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verantwortlicher</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Bearbeiten</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hardware.map((artikel) => (
                  <tr key={artikel.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {artikel.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {artikel.artikelnummer}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {artikel.hardware.serviceintervall_monate} Monate
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {artikel.hardware.wechselintervall_jahre} Jahre
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {artikel.hardware.verantwortlicher.name}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link
                        href={`/artikel/${artikel.id}/bearbeiten`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                ))}
                {hardware.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-sm text-gray-500 text-center">
                      Keine Hardware-Artikel vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verbrauchsmaterial-Tabelle */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Verbrauchsmaterial</h2>
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Beschreibung</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Mindestbestand</th>
                  <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Bearbeiten</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {verbrauchsmaterial.map((artikel) => (
                  <tr key={artikel.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {artikel.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {artikel.artikelnummer}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {artikel.beschreibung}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 text-right">
                      {artikel.mindestbestand} Stück
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link
                        href={`/artikel/${artikel.id}/bearbeiten`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                ))}
                {verbrauchsmaterial.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 text-center">
                      Kein Verbrauchsmaterial vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 