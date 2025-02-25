import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import BestellungForm from '@/components/bestellungen/BestellungForm';
import type { BestellPosition, Standort } from '@/types';
import { sendBestellungEmail } from '@/lib/email';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function NeueBestellungPage() {
  const router = useRouter();
  const { standortId } = router.query; // Optional: Vorausgewählter Standort

  // Standorte laden
  const { data: standorte, isLoading } = useQuery<Standort[]>({
    queryKey: ['standorte'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standorte')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Neue Bestellung
          </h2>
        </div>
      </div>

      {/* Wenn kein Standort ausgewählt ist */}
      {!standortId && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Standort auswählen
            </h3>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {standorte?.map((standort) => (
                <div
                  key={standort.id}
                  onClick={() => router.push(`/bestellungen/neu?standortId=${standort.id}`)}
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-gray-900">{standort.name}</p>
                      <p className="text-sm text-gray-500 truncate">{standort.adresse}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wenn ein Standort ausgewählt ist */}
      {standortId && (
        <BestellungForm standortId={standortId as string} />
      )}
    </Layout>
  );
} 