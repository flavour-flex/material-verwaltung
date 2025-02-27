import { useRouter } from 'next/router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { calculateNextServiceDate, calculateNextChangeDate, formatDate, getStatusColor } from '@/utils/dates';
import { toast } from 'react-hot-toast';
import type { Standort, Hardware, WareneingangPosition } from '@/types';
import WareneingangSection from '@/components/standorte/WareneingangSection';
import { useState } from 'react';
import AusbuchenDialog from '@/components/standorte/AusbuchenDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function StandortDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const [isAusbuchenOpen, setIsAusbuchenOpen] = useState(false);

  // Standort-Details laden
  const { data: standort, isLoading: standortLoading, error: standortError } = useQuery<Standort>({
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
    onError: (error) => {
      toast.error('Fehler beim Laden des Standorts');
      console.error('Standort Fehler:', error);
    },
  });

  // Hardware am Standort laden
  const { data: hardware, isLoading: hardwareLoading, error: hardwareError } = useQuery<Hardware[]>({
    queryKey: ['standort-hardware', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hardware')
        .select(`
          *,
          artikel:artikel_id (
            name,
            artikelnummer,
            beschreibung
          )
        `)
        .eq('standort_id', id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    onError: (error) => {
      toast.error('Fehler beim Laden der Hardware');
      console.error('Hardware Fehler:', error);
    },
  });

  // Warenbestand am Standort laden
  const { data: warenbestand, isLoading: warenbestandLoading } = useQuery({
    queryKey: ['standort-warenbestand', id],
    queryFn: async () => {
      if (!id) return { verbrauchsmaterial: [], bueromaterial: [] };

      const { data: wareneingaenge, error: wareneingangError } = await supabase
        .from('wareneingang')
        .select(`
          id,
          artikel:artikel_id (
            id,
            name,
            artikelnummer,
            kategorie,
            einheit
          ),
          menge,
          lagerorte,
          bestellung:bestellung_id (
            id,
            created_at
          )
        `)
        .eq('standort_id', id);

      console.log('Wareneingänge:', wareneingaenge); // Debug-Log

      if (wareneingangError) throw wareneingangError;

      // Warenbestand nach Artikel gruppieren
      const bestandMap = new Map();

      wareneingaenge?.forEach((eingang) => {
        if (!eingang.artikel) return; // Überspringe Einträge ohne Artikel

        const current = bestandMap.get(eingang.artikel.id) || {
          id: eingang.id,
          artikel: eingang.artikel,
          menge: 0,
          lagerorte: [],
          bestellung: eingang.bestellung
        };

        current.menge += eingang.menge;

        // Lagerorte zusammenführen
        if (Array.isArray(eingang.lagerorte)) {
          eingang.lagerorte.forEach((lo: { lagerort: string, menge: number }) => {
            const existingLagerort = current.lagerorte.find(
              (l: { lagerort: string }) => l.lagerort === lo.lagerort
            );

            if (existingLagerort) {
              existingLagerort.menge += lo.menge;
            } else {
              current.lagerorte.push({ ...lo });
            }
          });
        }

        bestandMap.set(eingang.artikel.id, current);
      });

      // Konvertiere Map zu Array und filtere nach Kategorie
      const alleArtikel = Array.from(bestandMap.values());
      
      // Log vor dem Return
      console.log('Gefilterte Artikel:', {
        verbrauchsmaterial: alleArtikel.filter(
          artikel => artikel.artikel?.kategorie?.toLowerCase() === 'verbrauchsmaterial'
        ),
        bueromaterial: alleArtikel.filter(
          artikel => artikel.artikel?.kategorie?.toLowerCase() === 'büromaterial'
        )
      });

      return {
        verbrauchsmaterial: alleArtikel.filter(
          artikel => artikel.artikel?.kategorie?.toLowerCase() === 'verbrauchsmaterial'
        ),
        bueromaterial: alleArtikel.filter(
          artikel => artikel.artikel?.kategorie?.toLowerCase() === 'büromaterial'
        )
      };
    },
    enabled: !!id, // Query nur ausführen, wenn id vorhanden ist
  });

  if (standortError || hardwareError) {
    return (
      <Layout>
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Fehler beim Laden der Daten
              </h3>
              <div className="mt-2 text-sm text-red-700">
                Bitte versuchen Sie es später erneut.
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (standortLoading || hardwareLoading || warenbestandLoading) {
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
            {standort?.name}
          </h2>
          <div className="mt-1 text-sm text-gray-500">
            {standort?.adresse}, {standort?.plz} {standort?.stadt}
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Verantwortliche</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {standort.verantwortliche.map((verantwortlicher, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 text-sm"
                >
                  <div className="font-medium text-gray-900">{verantwortlicher.name}</div>
                  <div className="text-gray-500 mt-1">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a 
                        href={`mailto:${verantwortlicher.email}`}
                        className="hover:text-indigo-600"
                      >
                        {verantwortlicher.email}
                      </a>
                    </div>
                    <div className="flex items-center mt-1">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <a 
                        href={`tel:${verantwortlicher.telefon}`}
                        className="hover:text-indigo-600"
                      >
                        {verantwortlicher.telefon}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href={`/standorte/${id as string}/bearbeiten`}
            className="ml-3 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
          >
            Bearbeiten
          </Link>
          <button
            onClick={() => setIsAusbuchenOpen(true)}
            className="ml-3 inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
          >
            Ausbuchen
          </button>
        </div>
      </div>

      <WareneingangSection 
        standortId={id as string} 
        onWareneingangComplete={() => {
          // Warenbestand neu laden
          queryClient.invalidateQueries(['standort-warenbestand', id]);
        }}
      />

      {/* Hardware-Sektion mit Service- und Wechseldaten */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Hardware</h3>
          <span className="text-sm text-gray-500">
            {hardware?.length || 0} Geräte
          </span>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service fällig</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Wechsel fällig</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Verantwortlicher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {hardware?.map((hw) => {
                  const nextService = calculateNextServiceDate(hw.created_at, hw.serviceintervall_monate);
                  const nextChange = calculateNextChangeDate(hw.created_at, hw.wechselintervall_jahre);
                  
                  return (
                    <tr key={hw.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {hw.artikel.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {hw.artikel.artikelnummer}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-4 text-sm ${getStatusColor(nextService)}`}>
                        {formatDate(nextService)}
                      </td>
                      <td className={`whitespace-nowrap px-6 py-4 text-sm ${getStatusColor(nextChange)}`}>
                        {formatDate(nextChange)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <div>
                          <div>{hw.verantwortlicher.name}</div>
                          <div className="text-xs text-gray-400">{hw.verantwortlicher.email}</div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!hardware || hardware.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 text-center">
                      Keine Hardware zugewiesen
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warenbestand-Sektion */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Warenbestand</h3>
        </div>
        
        {/* Verbrauchsmaterial */}
        <div className="border-t border-gray-200">
          <h4 className="px-4 py-3 text-md font-medium">Verbrauchsmaterial</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikel</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Gesamtmenge</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lagerorte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {warenbestand?.verbrauchsmaterial.map((position) => (
                  <tr key={position.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.artikel.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.artikel.artikelnummer}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.menge} {position.artikel.einheit || 'Stück'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.lagerorte?.map((lagerort, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{lagerort.lagerort}:</span>
                          <span className="ml-2">{lagerort.menge}</span>
                        </div>
                      ))}
                      {position.bestellung && (
                        <div className="text-indigo-600">
                          Bestellt vom {format(new Date(position.bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(!warenbestand?.verbrauchsmaterial || warenbestand.verbrauchsmaterial.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 text-center">
                      Kein Verbrauchsmaterial vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Büromaterial */}
        <div className="border-t border-gray-200">
          <h4 className="px-4 py-3 text-md font-medium">Büromaterial</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikel</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Artikelnummer</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Gesamtmenge</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lagerorte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {warenbestand?.bueromaterial.map((position) => (
                  <tr key={position.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.artikel.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.artikel.artikelnummer}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.menge} {position.artikel.einheit || 'Stück'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {position.lagerorte?.map((lagerort, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{lagerort.lagerort}:</span>
                          <span className="ml-2">{lagerort.menge}</span>
                        </div>
                      ))}
                      {position.bestellung && (
                        <div className="text-indigo-600">
                          Bestellt vom {format(new Date(position.bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(!warenbestand?.bueromaterial || warenbestand.bueromaterial.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 text-center">
                      Kein Büromaterial vorhanden
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AusbuchenDialog
        isOpen={isAusbuchenOpen}
        onClose={() => setIsAusbuchenOpen(false)}
        standortId={id as string}
        warenbestand={warenbestand || { verbrauchsmaterial: [], bueromaterial: [] }}
        onSuccess={() => {
          queryClient.invalidateQueries(['standort-warenbestand', id]);
          setIsAusbuchenOpen(false);
        }}
      />
    </Layout>
  );
} 