import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { Bestellung } from '@/types';
import { PrinterIcon } from '@heroicons/react/24/outline';

// Status-Farben Map
const statusColors = {
  offen: 'bg-yellow-100 text-yellow-800',
  versandt: 'bg-green-100 text-green-800',
  storniert: 'bg-red-100 text-red-800'
} as const;

type StatusType = keyof typeof statusColors;

interface Standort {
  id: string;
  name: string;
  bestellungen: Bestellung[];
}

interface Bestellung {
  id: string;
  created_at: string;
  status: StatusType;
  artikel: {
    artikel: {
      name: string;
      artikelnummer: string;
    };
    menge: number;
    versandte_menge: number;
  }[];
}

export default function BestellungenPage() {
  const [expandedStandorte, setExpandedStandorte] = useState<Set<string>>(new Set());

  // Bestellungen nach Standorten gruppiert laden
  const { data: standorte, isLoading } = useQuery<Standort[]>({
    queryKey: ['bestellungen-grouped'],
    queryFn: async () => {
      const { data: standorteData, error: standorteError } = await supabase
        .from('standorte')
        .select('id, name')
        .order('name');

      if (standorteError) throw standorteError;

      const standorteMitBestellungen = await Promise.all(
        standorteData.map(async (standort) => {
          const { data: bestellungen, error: bestellungenError } = await supabase
            .from('bestellungen')
            .select(`
              id,
              created_at,
              status,
              artikel:bestellung_artikel (
                artikel:artikel_id (
                  name,
                  artikelnummer
                ),
                menge,
                versandte_menge
              )
            `)
            .eq('standort_id', standort.id)
            .order('created_at', { ascending: false });

          if (bestellungenError) throw bestellungenError;

          return {
            ...standort,
            bestellungen: bestellungen || []
          };
        })
      );

      return standorteMitBestellungen;
    }
  });

  const toggleStandort = (standortId: string) => {
    setExpandedStandorte(prev => {
      const next = new Set(prev);
      if (next.has(standortId)) {
        next.delete(standortId);
      } else {
        next.add(standortId);
      }
      return next;
    });
  };

  if (isLoading) return <div>Laden...</div>;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Bestellungen</h1>
            <p className="mt-2 text-sm text-gray-700">
              Übersicht aller Bestellungen nach Standorten
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <Link
              href="/bestellungen/neu"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              Neue Bestellung
            </Link>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="mt-8 flex flex-col">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Standort / Datum
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Artikel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {standorte?.map((standort) => (
                        <React.Fragment key={standort.id}>
                          {/* Standort Header */}
                          <tr 
                            className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                            onClick={() => toggleStandort(standort.id)}
                          >
                            <td colSpan={3} className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                              <div className="flex items-center">
                                {expandedStandorte.has(standort.id) ? (
                                  <ChevronDownIcon className="h-5 w-5 text-gray-400 mr-2" />
                                ) : (
                                  <ChevronRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                                )}
                                <span className="font-medium">{standort.name}</span>
                                <span className="ml-2 text-gray-500">
                                  ({standort.bestellungen.length} Bestellung{standort.bestellungen.length !== 1 ? 'en' : ''})
                                </span>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Bestellungen des Standorts */}
                          {expandedStandorte.has(standort.id) && standort.bestellungen.map((bestellung) => (
                            <tr key={bestellung.id} className="hover:bg-gray-50">
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                                {format(new Date(bestellung.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${statusColors[bestellung.status]}`}>
                                  {bestellung.status}
                                </span>
                              </td>
                              <td className="px-3 py-4 text-sm text-gray-500">
                                <div className="space-y-1">
                                  {bestellung.artikel.map((position, idx) => (
                                    <div key={idx} className={idx > 0 ? 'border-t pt-1' : ''}>
                                      <div className="font-medium">{position.artikel.name}</div>
                                      <div className="text-xs text-gray-400 flex justify-between">
                                        <span>Art.Nr.: {position.artikel.artikelnummer}</span>
                                        <span>
                                          {position.versandte_menge} / {position.menge} versandt
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 