import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface Standort {
  id: string;
  name: string;
  adresse: string;
  plz: string;
  stadt: string;
  verantwortliche: Array<{ 
    email: string;
    name: string;
  }>;
  offene_bestellungen_count?: number;
  wareneingang_count?: number;
}

export default function StandortePage() {
  const { user, userRole, isAdmin } = useAuth();

  const { data: standorte, isLoading } = useQuery({
    queryKey: ['standorte-mit-bestellungen'],
    queryFn: async () => {
      let query = supabase
        .from('standorte')
        .select(`
          *,
          bestellungen!standort_id(
            id,
            status
          )
        `)
        .order('name');

      // Für nicht-Admins nur zugewiesene Standorte
      if (!isAdmin && user?.email) {
        query = query.filter('verantwortliche', 'cs', `[{"email": "${user.email}"}]`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fehler beim Laden der Standorte:', error);
        throw error;
      }

      // Bestellungen zählen
      return data?.map(standort => {
        const offeneBestellungen = standort.bestellungen?.filter(
          (b: any) => b.status === 'offen'
        ).length || 0;

        // Zähle Bestellungen im Wareneingang (versendet oder teilweise_versendet)
        const wareneingaenge = standort.bestellungen?.filter(
          (b: any) => b.status === 'versendet' || b.status === 'teilweise_versendet'
        ).length || 0;

        return {
          ...standort,
          offene_bestellungen_count: offeneBestellungen,
          wareneingang_count: wareneingaenge
        };
      }) || [];
    },
    enabled: !!user
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Standorte</h1>
          <p className="mt-2 text-sm text-gray-700">
            Übersicht aller Standorte und deren Verantwortliche.
          </p>
        </div>
        {isAdmin && (
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/standorte/neu"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#023770] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#034694] focus:outline-none focus:ring-2 focus:ring-[#023770] focus:ring-offset-2 sm:w-auto"
            >
              Neuer Standort
            </Link>
          </div>
        )}
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Adresse
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Verantwortliche
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {standorte?.map((standort: Standort) => (
                  <tr key={standort.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                      <div className="flex items-center">
                        {standort.offene_bestellungen_count > 0 && (
                          <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mr-2"
                          >
                            <ExclamationCircleIcon 
                              className="h-5 w-5 text-yellow-500" 
                              title={`${standort.offene_bestellungen_count} offene Bestellung(en)`}
                            />
                          </motion.div>
                        )}
                        <span className="font-medium text-gray-900">{standort.name}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div className="flex flex-col">
                        <span>{standort.adresse}</span>
                        <span>{standort.plz} {standort.stadt}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <div className="flex flex-col space-y-1">
                        {Array.isArray(standort.verantwortliche) && 
                          standort.verantwortliche.map((v, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <a
                                href={`mailto:${v.email}`}
                                className="text-[#023770] hover:text-[#034694] hover:underline flex items-center"
                                title={`Email an ${v.name} senden`}
                              >
                                <span>{v.name}</span>
                                <svg 
                                  className="h-4 w-4 ml-1" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                                  />
                                </svg>
                              </a>
                            </div>
                          ))
                        }
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {(standort.offene_bestellungen_count > 0 || standort.wareneingang_count > 0) ? (
                        <div className="space-y-1">
                          {standort.offene_bestellungen_count > 0 && (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                              {standort.offene_bestellungen_count} offene Bestellung(en)
                            </span>
                          )}
                          {standort.wareneingang_count > 0 && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                              {standort.wareneingang_count} Bestellung(en) im Wareneingang
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Keine
                        </span>
                      )}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Link 
                        href={`/standorte/${standort.id}`} 
                        className="text-[#023770] hover:text-[#034694]"
                      >
                        Details
                      </Link>
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