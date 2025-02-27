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

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

        {/* Wenn alle Daten laden, zeigen wir den LoadingSpinner im Content-Bereich */}
        {(bestellungenLoading && ausbuchungenLoading && bestandLoading && niedrigLoading) ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Statistik-Kacheln */}
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Kacheln mit Skeleton-Loading */}
              {(bestellungenLoading || ausbuchungenLoading || bestandLoading || niedrigLoading) ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 px-5 py-3">
                        <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Offene Bestellungen */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Offene Bestellungen
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">
                                {offeneBestellungen?.length || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-5 py-3">
                      <Link href="/bestellungen" className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                        Alle anzeigen
                      </Link>
                    </div>
                  </div>

                  {/* Gesamtbestand */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CubeIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Gesamtbestand
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">
                                {gesamtbestand?.gesamt || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <div className="text-sm text-gray-500">
                        {Object.entries(gesamtbestand?.kategorien || {}).map(([kategorie, anzahl]) => (
                          <div key={kategorie} className="flex justify-between">
                            <span>{kategorie}:</span>
                            <span>{anzahl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Niedrige Bestände */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Niedrige Bestände
                            </dt>
                            <dd className="flex items-baseline">
                              <div className="text-2xl font-semibold text-gray-900">
                                {niedrigeBestaende?.length || 0}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-3">
                      <div className="text-sm text-gray-500 space-y-1">
                        {niedrigeBestaende?.slice(0, 3).map(artikel => (
                          <div key={artikel.id} className="flex justify-between">
                            <span className="truncate">{artikel.name}</span>
                            <span className="ml-2">{artikel.bestand}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Letzte Aktivitäten */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Aktivitäten mit Skeleton-Loading */}
              {(bestellungenLoading || ausbuchungenLoading) ? (
                <>
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
                        <div className="space-y-4">
                          {[1, 2, 3].map((j) => (
                            <div key={j} className="flex items-center space-x-4">
                              <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                              </div>
                              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Letzte Ausbuchungen */}
                  <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Letzte Ausbuchungen
                      </h3>
                      <div className="mt-5 flow-root">
                        <div className="-my-4 divide-y divide-gray-200">
                          {letzteAusbuchungen?.map((ausbuchung) => (
                            <div key={ausbuchung.id} className="py-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <ArrowTrendingDownIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {ausbuchung.artikel.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {ausbuchung.menge} Stück • {ausbuchung.standort?.name}
                                  </p>
                                </div>
                                <div className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500">
                                  {format(new Date(ausbuchung.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offene Bestellungen Details */}
                  <div className="bg-white shadow sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <h3 className="text-lg font-medium leading-6 text-gray-900">
                        Offene Bestellungen
                      </h3>
                      <div className="mt-5 flow-root">
                        <div className="-my-4 divide-y divide-gray-200">
                          {offeneBestellungen?.map((bestellung) => (
                            <div key={bestellung.id} className="py-4">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-gray-900">
                                    {bestellung.standort.name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {bestellung.artikel.length} Artikel
                                  </p>
                                </div>
                                <div className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500">
                                  {format(new Date(bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
} 