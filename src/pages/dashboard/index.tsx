import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ClipboardDocumentListIcon,
  ArrowTrendingDownIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  BuildingOfficeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  // Offene Bestellungen
  const { data: offeneBestellungen, isLoading: bestellungenLoading } = useQuery({
    queryKey: ['offene-bestellungen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          id,
          created_at,
          standort:standort_id(name),
          artikel:bestellung_artikel(
            artikel:artikel_id(name),
            menge,
            versandte_menge
          )
        `)
        .eq('status', 'offen')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  // Letzte Ausbuchungen
  const { data: letzteAusbuchungen, isLoading: ausbuchungenLoading } = useQuery({
    queryKey: ['letzte-ausbuchungen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ausbuchungen')
        .select(`
          id,
          created_at,
          standort:standort_id(name),
          artikel:artikel_id(
            name,
            artikelnummer
          ),
          menge,
          referenz
        `)
        .eq('storniert', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  // Gesamtbestand aller Standorte
  const { data: gesamtbestand, isLoading: bestandLoading } = useQuery({
    queryKey: ['gesamtbestand'],
    queryFn: async () => {
      const { data: wareneingaenge, error: eingangError } = await supabase
        .from('wareneingang')
        .select(`
          menge,
          artikel:artikel_id(
            name,
            kategorie
          )
        `);

      if (eingangError) throw eingangError;

      const { data: ausbuchungen, error: ausbuchungError } = await supabase
        .from('ausbuchungen')
        .select('menge')
        .eq('storniert', false);

      if (ausbuchungError) throw ausbuchungError;

      // Berechne Gesamtbestand
      const gesamtEingang = wareneingaenge?.reduce((sum, pos) => sum + pos.menge, 0) || 0;
      const gesamtAusgang = ausbuchungen?.reduce((sum, pos) => sum + pos.menge, 0) || 0;
      
      // Berechne Kategorien
      const kategorienBestand = wareneingaenge?.reduce((acc, pos) => {
        const kategorie = pos.artikel.kategorie;
        acc[kategorie] = (acc[kategorie] || 0) + pos.menge;
        return acc;
      }, {} as Record<string, number>);

      return {
        gesamt: gesamtEingang - gesamtAusgang,
        kategorien: kategorienBestand
      };
    }
  });

  // Niedrige Bestände
  const { data: niedrigeBestaende, isLoading: niedrigLoading } = useQuery({
    queryKey: ['niedrige-bestaende'],
    queryFn: async () => {
      // Hier könnten wir eine komplexere Logik implementieren
      // Für jetzt zeigen wir einfach Artikel mit weniger als 10 Stück
      const { data, error } = await supabase.rpc('get_niedrige_bestaende', {
        min_bestand: 10
      });

      if (error) throw error;
      return data;
    }
  });

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Ihre Dashboard-Statistiken-Logik hier
      return {};
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Dashboard-Inhalt hier */}
        </div>
      </div>
    </Layout>
  );
} 