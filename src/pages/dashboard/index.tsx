import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  // Hardware mit anstehendem Service laden
  const { data: dueHardware } = useQuery({
    queryKey: ['due-hardware'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware')
        .select(`
          id,
          artikel:artikel_id (
            name,
            artikelnummer
          ),
          standort:standort_id (
            name
          ),
          last_service,
          next_service
        `)
        .lt('next_service', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data;
    },
  });

  const { data: standorte, isLoading: standorteLoading } = useQuery({
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

  const { data: bestellungen, isLoading: bestellungenLoading } = useQuery({
    queryKey: ['bestellungen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          *,
          standort:standort_id(name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  if (standorteLoading || bestellungenLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {/* Standorte Übersicht */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Standorte</h3>
              <div className="mt-4">
                <div className="flow-root">
                  <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {standorte?.map((standort) => (
                      <li key={standort.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{standort.name}</p>
                            <p className="truncate text-sm text-gray-500">
                              {standort.plz} {standort.stadt}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Letzte Bestellungen */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Letzte Bestellungen</h3>
              <div className="mt-4">
                <div className="flow-root">
                  <ul role="list" className="-my-5 divide-y divide-gray-200">
                    {bestellungen?.map((bestellung) => (
                      <li key={bestellung.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {bestellung.standort.name}
                            </p>
                            <p className="truncate text-sm text-gray-500">
                              Status: {bestellung.status}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 