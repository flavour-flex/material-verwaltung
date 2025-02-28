import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { PageContent } from '@/components/Layout';
import { format, subDays, startOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  ArrowTrendingDownIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Top 5 ausgebuchte Artikel (letzte 30 Tage)
  const { data: topArtikel, isLoading: artikelLoading } = useQuery({
    queryKey: ['top-artikel'],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from('ausbuchungen')
        .select(`
          artikel:artikel_id(
            id,
            name,
            artikelnummer,
            einheit
          ),
          menge
        `)
        .eq('storniert', false)
        .gte('created_at', thirtyDaysAgo);

      if (error) throw error;

      // Gruppieren und Summen berechnen
      const grouped = data.reduce((acc, curr) => {
        const artikelId = curr.artikel.id;
        if (!acc[artikelId]) {
          acc[artikelId] = {
            ...curr.artikel,
            gesamtMenge: 0
          };
        }
        acc[artikelId].gesamtMenge += curr.menge;
        return acc;
      }, {});

      return Object.values(grouped)
        .sort((a: any, b: any) => b.gesamtMenge - a.gesamtMenge)
        .slice(0, 5);
    }
  });

  // Neue Query: Standort-Aktivitäten
  const { data: standortAktivitaeten, isLoading: standortLoading } = useQuery({
    queryKey: ['standort-aktivitaeten'],
    queryFn: async () => {
      const { data: standorte, error: standorteError } = await supabase
        .from('standorte')
        .select(`
          id,
          name,
          bestellungen:bestellungen(count),
          ausbuchungen:ausbuchungen(count)
        `);

      if (standorteError) throw standorteError;

      return standorte.map(standort => ({
        ...standort,
        bestellungenCount: standort.bestellungen[0]?.count || 0,
        ausbuchungenCount: standort.ausbuchungen[0]?.count || 0,
        gesamtAktivitaet: (standort.bestellungen[0]?.count || 0) + (standort.ausbuchungen[0]?.count || 0)
      }))
      .sort((a, b) => b.gesamtAktivitaet - a.gesamtAktivitaet)
      .slice(0, 5);
    }
  });

  // Neue Query: Artikel-Kategorien-Verteilung
  const { data: kategorienVerteilung, isLoading: kategorienLoading } = useQuery({
    queryKey: ['kategorien-verteilung'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artikel')
        .select('kategorie');

      if (error) throw error;

      return data.reduce((acc, curr) => {
        acc[curr.kategorie] = (acc[curr.kategorie] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  });

  // Neue Query: Letzte Wareneingänge
  const { data: letzteWareneingaenge, isLoading: wareneingangLoading } = useQuery({
    queryKey: ['letzte-wareneingaenge'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wareneingang')
        .select(`
          id,
          created_at,
          menge,
          standort:standort_id(name),
          artikel:artikel_id(name, einheit)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    }
  });

  // Ausbuchungsstatistik (aktueller Monat)
  const { data: monatsStatistik, isLoading: statistikLoading } = useQuery({
    queryKey: ['monats-statistik'],
    queryFn: async () => {
      const startOfCurrentMonth = startOfMonth(new Date()).toISOString();
      
      const { data, error } = await supabase
        .from('ausbuchungen')
        .select(`
          id,
          menge,
          standort:standort_id(name)
        `)
        .eq('storniert', false)
        .gte('created_at', startOfCurrentMonth);

      if (error) throw error;

      // Statistiken berechnen
      const standortStats = data.reduce((acc, curr) => {
        const standortName = curr.standort.name;
        if (!acc[standortName]) {
          acc[standortName] = {
            anzahlAusbuchungen: 0,
            gesamtMenge: 0
          };
        }
        acc[standortName].anzahlAusbuchungen++;
        acc[standortName].gesamtMenge += curr.menge;
        return acc;
      }, {});

      return {
        totalAusbuchungen: data.length,
        standortStatistiken: Object.entries(standortStats)
          .sort(([, a]: any, [, b]: any) => b.anzahlAusbuchungen - a.anzahlAusbuchungen)
      };
    }
  });

  const isLoading = bestellungenLoading || artikelLoading || standortLoading || 
                    kategorienLoading || wareneingangLoading || statistikLoading;

  return (
    <Layout>
      <PageContent isLoading={isLoading}>
        <div className="space-y-6">
          {/* Statistik-Karten */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {offeneBestellungen?.length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ArrowTrendingDownIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Ausbuchungen (Monat)
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {monatsStatistik?.totalAusbuchungen || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Neue Card: Aktive Standorte */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BuildingOfficeIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Aktive Standorte
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {standortAktivitaeten?.length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Neue Card: Artikel-Kategorien */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Artikel-Kategorien
                      </dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">
                        {Object.keys(kategorienVerteilung || {}).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Artikel */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Top 5 Artikel (letzte 30 Tage)
              </h3>
              <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                            Artikel
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            Ausgebuchte Menge
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {topArtikel?.map((artikel: any) => (
                          <tr key={artikel.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                              <div className="flex flex-col">
                                <div className="font-medium text-gray-900">{artikel.name}</div>
                                <div className="text-gray-500">{artikel.artikelnummer}</div>
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                              {artikel.gesamtMenge} {artikel.einheit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Neue Sektion: Aktivste Standorte */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Aktivste Standorte
              </h3>
              <div className="mt-4 flow-root">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Standort
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Bestellungen
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Ausbuchungen
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Gesamt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {standortAktivitaeten?.map((standort) => (
                      <tr key={standort.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                          {standort.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                          {standort.bestellungenCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                          {standort.ausbuchungenCount}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium text-gray-900">
                          {standort.gesamtAktivitaet}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Neue Sektion: Letzte Wareneingänge */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Letzte Wareneingänge
              </h3>
              <div className="mt-4 flow-root">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                        Datum
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Standort
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Artikel
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                        Menge
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {letzteWareneingaenge?.map((wareneingang) => (
                      <tr key={wareneingang.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                          {format(new Date(wareneingang.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {wareneingang.standort.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {wareneingang.artikel.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                          {wareneingang.menge} {wareneingang.artikel.einheit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Monatsstatistik pro Standort */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-base font-semibold leading-6 text-gray-900">
                Ausbuchungen pro Standort (aktueller Monat)
              </h3>
              <div className="mt-4 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead>
                        <tr>
                          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                            Standort
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            Anzahl Ausbuchungen
                          </th>
                          <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
                            Gesamtmenge
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {monatsStatistik?.standortStatistiken.map(([standort, stats]: [string, any]) => (
                          <tr key={standort}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                              {standort}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                              {stats.anzahlAusbuchungen}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
                              {stats.gesamtMenge}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageContent>
    </Layout>
  );
} 