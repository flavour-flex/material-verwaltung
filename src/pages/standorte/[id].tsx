import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import WareneingangSection from '@/components/standorte/WareneingangSection';
import WarenbestandSection from '@/components/standorte/WarenbestandSection';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { TrashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

type TabType = 'info' | 'wareneingang' | 'warenbestand';

export default function StandortDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isCheckingUsage, setIsCheckingUsage] = useState(false);

  const { data: standort, isLoading } = useQuery({
    queryKey: ['standort', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standorte')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;

      // Prüfe Berechtigung
      if (!isAdmin) {
        const isResponsible = data.verantwortliche?.some(
          (v: any) => v.email === user?.email
        );
        if (!isResponsible) {
          router.push('/bestellungen/neu');
          return null;
        }
      }
      
      return data;
    },
    enabled: !!id && !!user
  });

  // Mutation zum Löschen des Standorts
  const deleteStandort = useMutation({
    mutationFn: async () => {
      setIsCheckingUsage(true);
      
      try {
        // Prüfen ob Artikel jemals gebucht wurden
        const { data: buchungen, error: buchungenError } = await supabase
          .from('ausbuchungen')
          .select('id')
          .eq('standort_id', id)
          .limit(1);

        if (buchungenError) throw buchungenError;

        if (buchungen && buchungen.length > 0) {
          throw new Error('Dieser Standort wurde bereits verwendet und kann nicht gelöscht werden.');
        }

        // Wenn keine Buchungen gefunden wurden, Standort löschen
        const { error: deleteError } = await supabase
          .from('standorte')
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;

      } finally {
        setIsCheckingUsage(false);
      }
    },
    onSuccess: () => {
      toast.success('Standort erfolgreich gelöscht');
      queryClient.invalidateQueries(['standorte']);
      router.push('/standorte');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Fehler beim Löschen des Standorts');
    }
  });

  const handleDelete = async () => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Standort löschen möchten?')) {
      deleteStandort.mutate();
    }
  };

  if (isLoading) return <LoadingSpinner />;

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
            {standort?.name}
          </h2>
          <div className="mt-1 text-sm text-gray-500">
            {standort?.adresse}, {standort?.plz} {standort?.stadt}
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
          {/* Ausbuchen Button - für alle sichtbar */}
          <Link
            href={`/standorte/${standort.id}/ausbuchen`}
            className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Ausbuchen
          </Link>

          {/* Bearbeiten und Warenbestand nur für Admins */}
          {isAdmin && (
            <>
              <Link
                href={`/standorte/${standort.id}/bearbeiten`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Bearbeiten
              </Link>
              <Link
                href={`/standorte/${standort.id}/warenbestand`}
                className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Warenbestand aktualisieren
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('info')}
            className={`
              ${activeTab === 'info' 
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
            `}
          >
            Informationen
          </button>
          <button
            onClick={() => setActiveTab('wareneingang')}
            className={`
              ${activeTab === 'wareneingang'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
            `}
          >
            Wareneingang
          </button>
          <button
            onClick={() => setActiveTab('warenbestand')}
            className={`
              ${activeTab === 'warenbestand'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }
              whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium
            `}
          >
            Warenbestand
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verantwortliche</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(standort?.verantwortliche) && standort.verantwortliche.length > 0 ? (
              standort.verantwortliche.map((verantwortlicher, index) => (
                <div 
                  key={`${verantwortlicher.email}-${index}`}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <p className="font-medium">{verantwortlicher.name}</p>
                  <p className="text-gray-500">{verantwortlicher.email}</p>
                  {verantwortlicher.telefon && (
                    <p className="text-gray-500">{verantwortlicher.telefon}</p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">Keine Verantwortlichen zugewiesen</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'wareneingang' && (
        <WareneingangSection 
          standortId={standort.id} 
          onWareneingangComplete={() => setActiveTab('warenbestand')} 
        />
      )}

      {activeTab === 'warenbestand' && (
        <WarenbestandSection standortId={standort.id} />
      )}

      {/* Lösch-Button (nur für Admins) */}
      {isAdmin && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDelete}
                disabled={isCheckingUsage || deleteStandort.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Standort löschen
              </button>
              
              {/* Überprüfungs-Animation */}
              {isCheckingUsage && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center text-sm text-gray-500"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="mr-2 h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"
                  />
                  Überprüfe Verwendung...
                </motion.div>
              )}
            </div>
          </div>
          
          {/* Hinweis */}
          <p className="mt-2 text-sm text-gray-500">
            Ein Standort kann nur gelöscht werden, wenn noch keine Artikel darauf gebucht wurden.
          </p>
        </div>
      )}
    </Layout>
  );
}