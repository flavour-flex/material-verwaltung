import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import StandortForm from '@/components/standorte/StandortForm';
import type { Standort } from '@/types';

export default function NeuerStandortPage() {
  const router = useRouter();

  const createStandort = useMutation({
    mutationFn: async (data: Omit<Standort, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('standorte')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      router.push('/standorte');
    },
  });

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Neuer Standort
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <StandortForm onSubmit={createStandort.mutateAsync} />
      </div>
    </Layout>
  );
} 