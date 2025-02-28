import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import { PageContent } from '@/components/Layout';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ClipboardDocumentListIcon,
  CubeIcon,
  WrenchScrewdriverIcon,
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

  const isLoading = bestellungenLoading || ausbuchungenLoading;

  return (
    <Layout>
      <PageContent isLoading={isLoading}>
        <div className="space-y-6">
          {/* Offene Bestellungen */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Offene Bestellungen
              </h2>
              <Link
                href="/bestellungen"
                className="text-sm font-medium text-[#023770] hover:text-[#034694]"
              >
                Alle anzeigen
              </Link>
            </div>
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {offeneBestellungen?.map((bestellung) => (
                  <li key={bestellung.id}>
                    <Link
                      href={`/bestellungen/${bestellung.id}`}
                      className="block hover:bg-gray-50"
                    >
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <ClipboardDocumentListIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <p className="text-sm font-medium text-[#023770] truncate">
                              {bestellung.standort?.name}
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {format(new Date(bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Letzte Ausbuchungen */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Letzte Ausbuchungen
              </h2>
              <Link
                href="/ausbuchungen"
                className="text-sm font-medium text-[#023770] hover:text-[#034694]"
              >
                Alle anzeigen
              </Link>
            </div>
            <div className="overflow-hidden bg-white shadow sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {letzteAusbuchungen?.map((ausbuchung) => (
                  <li key={ausbuchung.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <CubeIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {ausbuchung.artikel?.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {ausbuchung.standort?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(ausbuchung.created_at), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="text-sm text-gray-500">
                            Menge: {ausbuchung.menge}
                          </p>
                        </div>
                        {ausbuchung.referenz && (
                          <div className="mt-2 sm:mt-0">
                            <p className="text-sm text-gray-500">
                              Ref: {ausbuchung.referenz}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </PageContent>
    </Layout>
  );
} 