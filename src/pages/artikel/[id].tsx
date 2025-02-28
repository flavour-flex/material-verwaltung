import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { ArrowLeftIcon, CubeIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function ArtikelDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  // Artikel-Details abrufen
  const { data: artikel, isLoading: artikelLoading } = useQuery({
    queryKey: ['artikel', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artikel')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Gesamtbestand über alle Standorte
  const { data: warenbestand, isLoading: bestandLoading } = useQuery({
    queryKey: ['artikel-bestand', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wareneingang')
        .select(`
          menge,
          standort:standort_id(name)
        `)
        .eq('artikel_id', id);

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  // Ausbuchungshistorie
  const { data: ausbuchungen, isLoading: ausbuchungenLoading } = useQuery({
    queryKey: ['artikel-ausbuchungen', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ausbuchungen')
        .select(`
          id,
          created_at,
          menge,
          referenz,
          standort:standort_id(name)
        `)
        .eq('artikel_id', id)
        .eq('storniert', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (artikelLoading || bestandLoading || ausbuchungenLoading) {
    return <LoadingSpinner />;
  }

  // Berechne Gesamtbestand
  const gesamtBestand = warenbestand?.reduce((sum, w) => sum + w.menge, 0) || 0;
  const gesamtAusbuchungen = ausbuchungen?.reduce((sum, a) => sum + a.menge, 0) || 0;

  // Gruppiere Bestand nach Standorten
  const bestandProStandort = warenbestand?.reduce((acc, w) => {
    acc[w.standort.name] = (acc[w.standort.name] || 0) + w.menge;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
              {artikel?.name}
            </h2>
            <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="font-semibold mr-2">Artikelnummer:</span>
                {artikel?.artikelnummer}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="font-semibold mr-2">Kategorie:</span>
                {artikel?.kategorie}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span className="font-semibold mr-2">Einheit:</span>
                {artikel?.einheit}
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Link
              href={`/artikel/${id}/bearbeiten`}
              className="ml-3 inline-flex items-center rounded-md bg-[#023770] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#034694] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#023770]"
            >
              Bearbeiten
            </Link>
          </div>
        </div>

        {/* Beschreibung */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Beschreibung</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
              <p>{artikel?.beschreibung || 'Keine Beschreibung vorhanden'}</p>
            </div>
          </div>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Gesamtbestand</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{gesamtBestand}</div>
                      <div className="ml-2 text-sm text-gray-500">{artikel?.einheit}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingDownIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Gesamte Ausbuchungen</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{gesamtAusbuchungen}</div>
                      <div className="ml-2 text-sm text-gray-500">{artikel?.einheit}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bestand pro Standort */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Bestand pro Standort</h3>
            <div className="mt-4 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Standort</th>
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Bestand</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {Object.entries(bestandProStandort).map(([standort, menge]) => (
                        <tr key={standort}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">{standort}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                            {menge} {artikel?.einheit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Letzte Ausbuchungen */}
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Letzte Ausbuchungen</h3>
            <div className="mt-4 flow-root">
              <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Datum</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Standort</th>
                        <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Menge</th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Referenz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {ausbuchungen?.map((ausbuchung) => (
                        <tr key={ausbuchung.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                            {format(new Date(ausbuchung.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {ausbuchung.standort.name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                            {ausbuchung.menge} {artikel?.einheit}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {ausbuchung.referenz || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 