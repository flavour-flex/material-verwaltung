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

  // Debug-Log für Router und ID
  console.debug('Router state:', { pathname: router.pathname, query: router.query });

  // Standort-Daten laden
  const { data: standort, isLoading, error: loadError } = useQuery<Standort>({
    queryKey: ['standort', id],
    queryFn: async () => {
      console.debug('Fetching standort data for ID:', id);

      const { data, error } = await supabase
        .from('standorte')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching standort:', error);
        toast.error(`Fehler beim Laden des Standorts: ${error.message}`);
        throw error;
      }

      console.debug('Fetched standort data:', data);
      return data;
    },
    enabled: !!id,
    retry: 2,
    onError: (error) => {
      console.error('Query error:', error);
      toast.error('Standort konnte nicht geladen werden');
    }
  });

  // Mutation für das Aktualisieren des Standorts
  const updateStandort = useMutation({
    mutationFn: async (data: StandortFormData) => {
      console.debug('Updating standort with data:', data);

      // Validierung der PLZ
      if (data.plz && !/^\d{5}$/.test(data.plz)) {
        throw new Error('PLZ muss aus 5 Ziffern bestehen');
      }

      const toastId = toast.loading('Standort wird aktualisiert...');

      try {
        const { error } = await supabase
          .from('standorte')
          .update(data)
          .eq('id', id);
        
        if (error) {
          console.error('Update error:', error);
          toast.error(`Fehler beim Aktualisieren: ${error.message}`, {
            id: toastId
          });
          throw error;
        }

        // Cache invalidieren
        await Promise.all([
          queryClient.invalidateQueries(['standorte']),
          queryClient.invalidateQueries(['standort', id])
        ]);

        console.debug('Standort successfully updated');
        toast.success('Standort erfolgreich aktualisiert', {
          id: toastId
        });

        // Kurze Verzögerung für die Cache-Aktualisierung
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Weiterleitung mit Error-Handling
        try {
          await router.push(`/standorte/${id}`);
        } catch (routerError) {
          console.error('Navigation error:', routerError);
          // Fallback zur harten Navigation
          window.location.href = `/standorte/${id}`;
        }

      } catch (error) {
        // Toast ID wird in der äußeren catch-Block behandelt
        throw error;
      }
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error(error.message || 'Fehler beim Aktualisieren des Standorts');
    }
  });

  // Loading-Zustand
  if (isLoading) {
    return (
      <Layout>
        <LoadingSpinner />
      </Layout>
    );
  }

  // Error-Zustand
  if (loadError) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600">
            Fehler beim Laden des Standorts
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Zurück
          </button>
        </div>
      </Layout>
    );
  }

  // Nicht gefunden
  if (!standort) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">
            Standort nicht gefunden
          </h3>
          <button
            onClick={() => router.push('/standorte')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Zur Übersicht
          </button>
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