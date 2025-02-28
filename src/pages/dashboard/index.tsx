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

  if (bestellungenLoading || ausbuchungenLoading || bestandLoading || niedrigLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Layout>
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        {/* Statistik-Karten */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Offene Bestellungen</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                      {offeneBestellungen?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/bestellungen" className="font-medium text-indigo-700 hover:text-indigo-900">
                  Alle Bestellungen ansehen
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CubeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Gesamtbestand</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                      {gesamtbestand?.gesamt || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/artikel" className="font-medium text-indigo-700 hover:text-indigo-900">
                  Artikel verwalten
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingDownIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Letzte Ausbuchungen</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                      {letzteAusbuchungen?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/ausbuchungen" className="font-medium text-indigo-700 hover:text-indigo-900">
                  Alle Ausbuchungen
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">Niedrige Bestände</dt>
                    <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                      {niedrigeBestaende?.length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/artikel" className="font-medium text-indigo-700 hover:text-indigo-900">
                  Artikel prüfen
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bestandsübersicht nach Kategorien */}
        {gesamtbestand?.kategorien && Object.keys(gesamtbestand.kategorien).length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium leading-6 text-gray-900">Bestand nach Kategorien</h2>
            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(gesamtbestand.kategorien).map(([kategorie, bestand]) => (
                <div key={kategorie} className="overflow-hidden rounded-lg bg-white shadow">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ChartBarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">
                            {kategorie.charAt(0).toUpperCase() + kategorie.slice(1)}
                          </dt>
                          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
                            {bestand}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Letzte Aktivitäten */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Offene Bestellungen */}
          <div>
            <h2 className="text-lg font-medium leading-6 text-gray-900">Offene Bestellungen</h2>
            <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Datum</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Standort</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Artikel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {offeneBestellungen?.map((bestellung) => (
                    <tr key={bestellung.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                        {format(new Date(bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {bestellung.standort?.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        {bestellung.artikel?.length} Artikel
                      </td>
                    </tr>
                  ))}
                  {(!offeneBestellungen || offeneBestellungen.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-sm text-gray-500 text-center">
                        Keine offenen Bestellungen
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Letzte Ausbuchungen */}
          <div>
            <h2 className="text-lg font-medium leading-6 text-gray-900">Letzte Ausbuchungen</h2>
            <div className="mt-2 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Datum</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Artikel</th>
                    <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Menge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {letzteAusbuchungen?.map((ausbuchung) => (
                    <tr key={ausbuchung.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                        {format(new Date(ausbuchung.created_at), 'dd.MM.yyyy', { locale: de })}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {ausbuchung.artikel?.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-500">
                        {ausbuchung.menge}
                      </td>
                    </tr>
                  ))}
                  {(!letzteAusbuchungen || letzteAusbuchungen.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-sm text-gray-500 text-center">
                        Keine Ausbuchungen vorhanden
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 