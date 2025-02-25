import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading: authChecking, user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [bestellungen, hardware, anstehenderService] = await Promise.all([
        supabase.from('bestellungen').select('status').eq('status', 'offen'),
        supabase.from('hardware').select('id'),
        supabase.from('hardware').select('id').lt('next_service', new Date().toISOString())
      ]);

      return {
        offeneBestellungen: bestellungen.data?.length || 0,
        totalHardware: hardware.data?.length || 0,
        serviceNoetig: anstehenderService.data?.length || 0
      };
    }
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