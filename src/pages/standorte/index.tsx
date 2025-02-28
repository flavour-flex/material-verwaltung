import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export default function StandortePage() {
  const { user, userRole, isAdmin } = useAuth();

  // Standorte abrufen
  const { data: standorte, isLoading } = useQuery({
    queryKey: ['standorte'],
    queryFn: async () => {
      // Für Admins alle Standorte abrufen
      if (isAdmin) {
        const { data, error } = await supabase
          .from('standorte')
          .select('*')
          .order('name');

        if (error) throw error;
        return data;
      }

      // Für Standortverantwortliche nur zugewiesene Standorte
      if (user?.email) {
        const { data, error } = await supabase
          .from('standorte')
          .select('*')
          .filter('verantwortliche', 'cs', `[{"email": "${user.email}"}]`)
          .order('name');

        if (error) throw error;
        return data;
      }

      return [];
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
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {standorte?.map((standort) => (
                  <tr key={standort.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {standort.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {standort.adresse}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {Array.isArray(standort.verantwortliche) 
                        ? standort.verantwortliche.map(v => v.email).join(', ')
                        : ''}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Link 
                        href={`/standorte/${standort.id}`} 
                        className="text-indigo-600 hover:text-indigo-900"
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