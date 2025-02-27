import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { queryClient } from '@/lib/queryClient';
import { sendBestellungVersendetEmail } from '@/lib/email';

export default function BestellungDetailsPage() {
  const router = useRouter();
  const { id } = router.query;

  const { data: bestellung, isLoading } = useQuery({
    queryKey: ['bestellung', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          *,
          standort:standort_id (
            name,
            adresse
          ),
          bestellung_artikel!bestellung_id (
            menge,
            artikel:artikel_id (
              name,
              artikelnummer,
              beschreibung,
              kategorie
            )
          ),
          ersteller:profiles!ersteller_id (
            email,
            full_name
          ),
          versender:profiles!versender_id (
            email,
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      console.log('Bestellung data:', data);
      return data;
    },
    enabled: !!id,
  });

  const markAsVersandtMutation = useMutation({
    mutationFn: async (bestellungId: string) => {
      const { data: bestellung, error: updateError } = await supabase
        .from('bestellungen')
        .update({ status: 'versandt' })
        .eq('id', bestellungId)
        .select(`
          id,
          standort:standort_id (
            name,
            verantwortlicher:verantwortlicher_id (
              email,
              full_name
            )
          ),
          artikel:bestellung_artikel (
            artikel:artikel_id (
              name,
              artikelnummer
            ),
            menge,
            versandte_menge
          )
        `)
        .single();

      if (updateError) throw updateError;

      await sendBestellungVersendetEmail(bestellung);

      return bestellung;
    },
    onSuccess: () => {
      toast.success('Bestellung wurde als versendet markiert');
      queryClient.invalidateQueries({ queryKey: ['bestellung'] });
    },
    onError: (error) => {
      toast.error('Fehler beim Markieren der Bestellung als versendet');
      console.error('Fehler:', error);
    }
  });

  if (isLoading) return <LoadingSpinner />;
  if (!bestellung) return null;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/bestellungen"
                className="group flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="mr-1 h-5 w-5" />
                Zurück
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Bestellung #{bestellung.id.slice(0, 8)}
              </h1>
            </div>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="overflow-hidden bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Bestelldetails
              </h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      bestellung.status === 'offen' ? 'bg-yellow-100 text-yellow-800' :
                      bestellung.status === 'versendet' ? 'bg-blue-100 text-blue-800' :
                      bestellung.status === 'storniert' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {bestellung.status}
                    </span>
                  </dd>
                </div>

                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Standort</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {bestellung.standort.name}
                    <p className="text-gray-500">{bestellung.standort.adresse}</p>
                  </dd>
                </div>

                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Erstellt von</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {bestellung.ersteller?.full_name || bestellung.ersteller?.email}
                    <p className="text-gray-500">
                      am {format(new Date(bestellung.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </p>
                  </dd>
                </div>

                {bestellung.versender && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Versendet von</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {bestellung.versender?.full_name || bestellung.versender?.email}
                      <p className="text-gray-500">
                        am {format(new Date(bestellung.versand_datum), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </p>
                    </dd>
                  </div>
                )}

                {bestellung.eingetroffen_datum && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Eingetroffen am</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {format(new Date(bestellung.eingetroffen_datum), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </dd>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Artikel</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Artikel</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                            <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Kategorie</th>
                            <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Menge</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {bestellung.bestellung_artikel.map((pos: any) => (
                            <tr key={pos.artikel.id}>
                              <td className="py-4 pl-4 pr-3 text-sm text-gray-900">
                                {pos.artikel.name}
                                {pos.artikel.beschreibung && (
                                  <p className="text-gray-500">{pos.artikel.beschreibung}</p>
                                )}
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">{pos.artikel.artikelnummer}</td>
                              <td className="px-3 py-4 text-sm text-gray-500">{pos.artikel.kategorie}</td>
                              <td className="px-3 py-4 text-sm text-right text-gray-500">{pos.menge} Stück</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 