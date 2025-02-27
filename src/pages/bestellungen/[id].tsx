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
          id,
          status,
          created_at,
          standort:standort_id (
            name,
            adresse
          ),
          bestellung_artikel!bestellung_id ( 
            id,
            menge,
            versandte_menge,
            artikel:artikel_id (
              id,
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
            <Link href="/bestellungen" className="inline-flex items-center text-indigo-600 hover:text-indigo-900">
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Zurück zur Übersicht
            </Link>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900">
              Bestellung #{bestellung.id}
            </h1>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Artikel
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Artikelnummer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                      Bestellt
                    </th>
                    {bestellung?.status === 'teilweise_versendet' && (
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Versendet
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bestellung?.bestellung_artikel?.map((position) => (
                    <tr key={`${position.artikel?.id}-${position.id}`}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0">
                        {position.artikel?.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {position.artikel?.artikelnummer}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                        {position.menge} Stück
                      </td>
                      {bestellung.status === 'teilweise_versendet' && (
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                          {position.versandte_menge || 0} Stück
                        </td>
                      )}
                    </tr>
                  ))}
                  {(!bestellung?.bestellung_artikel || bestellung.bestellung_artikel.length === 0) && (
                    <tr>
                      <td 
                        colSpan={bestellung?.status === 'teilweise_versendet' ? 4 : 3} 
                        className="px-3 py-4 text-sm text-gray-500 text-center"
                      >
                        Keine Artikel in dieser Bestellung
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 