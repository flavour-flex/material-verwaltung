import { useRouter } from 'next/router';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import ArtikelForm from '@/components/artikel/ArtikelForm';
import type { Artikel } from '@/types';
import { toast } from 'react-hot-toast';

export default function NeuerArtikelPage() {
  const router = useRouter();

  const createArtikel = useMutation({
    mutationFn: async (data: Omit<Artikel, 'id' | 'created_at'>) => {
      try {
        // Erst den Basis-Artikel erstellen
        const { data: artikel, error: artikelError } = await supabase
          .from('artikel')
          .insert({
            name: data.name,
            artikelnummer: data.artikelnummer,
            beschreibung: data.beschreibung,
            kategorie: data.kategorie,
            einheit: data.einheit,
          })
          .select()
          .single();

        if (artikelError) {
          if (artikelError.code === '23505') { // Unique constraint violation
            throw new Error('Diese Artikelnummer existiert bereits.');
          }
          throw artikelError;
        }

        // Wenn es Hardware ist, zusätzliche Daten in hardware-Tabelle speichern
        if (data.kategorie === 'Hardware') {
          const { error: hardwareError } = await supabase
            .from('hardware')
            .insert({
              artikel_id: artikel.id,
              serviceintervall_monate: data.serviceintervall_monate!,
              wechselintervall_jahre: data.wechselintervall_jahre!,
              standort_id: data.standort_id!,
              verantwortlicher: data.verantwortlicher!,
            });

          if (hardwareError) {
            // Rollback: Artikel löschen wenn Hardware-Eintrag fehlschlägt
            await supabase
              .from('artikel')
              .delete()
              .eq('id', artikel.id);
            
            throw hardwareError;
          }
        }
      } catch (error: any) {
        console.error('Fehler beim Erstellen des Artikels:', error);
        throw new Error(error.message || 'Fehler beim Erstellen des Artikels');
      }
    },
    onSuccess: () => {
      toast.success('Artikel erfolgreich erstellt');
      router.push('/artikel');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Neuer Artikel
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <ArtikelForm onSubmit={createArtikel.mutateAsync} />
      </div>
    </Layout>
  );
} 