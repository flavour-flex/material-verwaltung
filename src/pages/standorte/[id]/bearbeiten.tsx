import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import StandortForm from '@/components/standorte/StandortForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import type { Standort } from '@/types';

export default function StandortBearbeitenPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  // Standort-Daten laden
  const { data: standort, isLoading } = useQuery<Standort>({
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
    enabled: !!id,
  });

  // Mutation für das Aktualisieren des Standorts
  const updateStandort = useMutation({
    mutationFn: async (data: StandortFormData) => {
      const { error } = await supabase
        .from('standorte')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Cache invalidieren
      queryClient.invalidateQueries(['standorte']);
      queryClient.invalidateQueries(['standort', id]);
      
      // Erfolgsmeldung
      toast.success('Standort erfolgreich aktualisiert');
      
      // Kurze Verzögerung für die Cache-Aktualisierung
      setTimeout(() => {
        router.push(`/standorte/${id}`);
      }, 100);
    },
    onError: (error) => {
      console.error('Update error:', error);
      toast.error('Fehler beim Aktualisieren des Standorts');
    },
  });

  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  if (!standort) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            Standort nicht gefunden
          </h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {standort.name} bearbeiten
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <StandortForm 
          initialData={standort} 
          onSubmit={updateStandort.mutateAsync}
        />
      </div>
    </Layout>
  );
} 