import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function StandortDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAdmin } = useAuth();

  const { data: standort, isLoading } = useQuery({
    queryKey: ['standort', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standorte')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <h2 className="text-2xl font-bold">{standort?.name}</h2>
      </div>
    </Layout>
  );
}