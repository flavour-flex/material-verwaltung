import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const { isLoading: authChecking, user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      try {
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        console.log('Formatted date:', currentDate); // Debug-Ausgabe

        const [bestellungen, hardware] = await Promise.all([
          supabase.from('bestellungen').select('status').eq('status', 'offen'),
          supabase.from('hardware').select('id'),
        ]);

        // Separate Hardware-Abfrage für besseres Debugging
        console.log('Attempting service query with date:', currentDate);

        const { data: serviceData, error: serviceError } = await supabase
          .from('hardware')
          .select('id, last_service')
          .lt('last_service', currentDate);

        if (serviceError) {
          console.error('Service Query Error:', {
            message: serviceError.message,
            details: serviceError.details,
            hint: serviceError.hint,
            code: serviceError.code
          });
          throw serviceError;
        }

        console.log('Service Data:', {
          count: serviceData?.length || 0,
          firstFew: serviceData?.slice(0, 3),
          dateExample: serviceData?.[0]?.last_service
        });

        return {
          offeneBestellungen: bestellungen.data?.length || 0,
          totalHardware: hardware.data?.length || 0,
          serviceNoetig: serviceData?.length || 0
        };
      } catch (error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        return {
          offeneBestellungen: 0,
          totalHardware: 0,
          serviceNoetig: 0
        };
      }
    },
    enabled: !authChecking && !!user
  });

  if (authChecking) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <dl className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Offene Bestellungen</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {statsLoading ? '...' : stats?.offeneBestellungen}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Hardware Gesamt</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {statsLoading ? '...' : stats?.totalHardware}
          </dd>
        </div>
        <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
          <dt className="truncate text-sm font-medium text-gray-500">Service nötig</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {statsLoading ? '...' : stats?.serviceNoetig}
          </dd>
        </div>
      </dl>
    </Layout>
  );
} 