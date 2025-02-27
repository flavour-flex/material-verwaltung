import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import type { BestellungType } from '@/types';

interface GroupedBestellungen {
  [standortName: string]: BestellungType[];
}

export default function BestellungenPage() {
  const [expandedStandorte, setExpandedStandorte] = useState<Set<string>>(new Set());

  const { data: bestellungen, isLoading } = useQuery({
    queryKey: ['bestellungen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestellungen')
        .select(`
          id,
          status,
          created_at,
          standort:standort_id (
            name
          ),
          bestellung_artikel (
            id,
            menge,
            versandte_menge,
            artikel:artikel_id (
              id,
              name,
              artikelnummer
            )
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Bestellungen nach Standorten gruppieren
  const groupedBestellungen = bestellungen?.reduce<GroupedBestellungen>((acc, bestellung) => {
    const standortName = bestellung.standort?.name || 'Unbekannt';
    if (!acc[standortName]) {
      acc[standortName] = [];
    }
    acc[standortName].push(bestellung);
    return acc;
  }, {});

  const toggleStandort = (standortName: string) => {
    setExpandedStandorte(prev => {
      const next = new Set(prev);
      if (next.has(standortName)) {
        next.delete(standortName);
      } else {
        next.add(standortName);
      }
      return next;
    });
  };

  if (isLoading) return <LoadingSpinner />;

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

        <div className="mt-8 flex flex-col">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
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
                  {Object.entries(groupedBestellungen || {}).map(([standortName, standortBestellungen]) => (
                    <React.Fragment key={standortName}>
                      {/* Standort Header */}
                      <tr 
                        className="bg-gray-50 cursor-pointer hover:bg-gray-100"
                        onClick={() => toggleStandort(standortName)}
                      >
                        <td colSpan={3} className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            {expandedStandorte.has(standortName) ? (
                              <ChevronDownIcon className="h-5 w-5 text-gray-400 mr-2" />
                            ) : (
                              <ChevronRightIcon className="h-5 w-5 text-gray-400 mr-2" />
                            )}
                            <span className="font-medium">{standortName}</span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Bestellungen des Standorts */}
                      {expandedStandorte.has(standortName) && standortBestellungen.map((bestellung) => (
                        <tr key={bestellung.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-500 sm:pl-6">
                            {format(new Date(bestellung.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              bestellung.status === 'offen' ? 'bg-yellow-100 text-yellow-800' :
                              bestellung.status === 'versendet' ? 'bg-blue-100 text-blue-800' :
                              bestellung.status === 'storniert' ? 'bg-red-100 text-red-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {bestellung.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            <Link 
                              href={`/bestellungen/${bestellung.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              {bestellung.bestellung_artikel.length} Artikel anzeigen
                            </Link>
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
    </Layout>
  );
} 