import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';

type ArtikelKategorie = 'Verbrauchsmaterial' | 'Büromaterial' | 'all';

export default function ArtikelPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategorie, setSelectedKategorie] = useState<ArtikelKategorie>('all');

  const { data: artikel, isLoading } = useQuery({
    queryKey: ['artikel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artikel')
        .select('*')
        .in('kategorie', ['Verbrauchsmaterial', 'Büromaterial'])
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Artikel filtern basierend auf Suche und Kategorie
  const filteredArtikel = artikel?.filter(artikel => {
    const matchesSearch = 
      artikel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artikel.artikelnummer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artikel.beschreibung?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesKategorie = selectedKategorie === 'all' || artikel.kategorie === selectedKategorie;

    return matchesSearch && matchesKategorie;
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Artikel</h1>
          <p className="mt-2 text-sm text-gray-700">
            Übersicht aller Artikel im System.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/artikel/neu"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#023770] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#034694] focus:outline-none focus:ring-2 focus:ring-[#023770] focus:ring-offset-2 sm:w-auto"
          >
            Neuer Artikel
          </Link>
        </div>
      </div>

      {/* Filter und Suche */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Suchleiste */}
        <div className="relative rounded-md shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#023770] sm:text-sm sm:leading-6"
            placeholder="Artikel suchen..."
          />
        </div>

        {/* Kategorie-Filter */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
          <select
            value={selectedKategorie}
            onChange={(e) => setSelectedKategorie(e.target.value as ArtikelKategorie)}
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-[#023770] sm:text-sm sm:leading-6"
          >
            <option value="all">Alle Kategorien</option>
            <option value="Verbrauchsmaterial">Verbrauchsmaterial</option>
            <option value="Büromaterial">Büromaterial</option>
          </select>
        </div>
      </div>

      {/* Ergebniszähler */}
      <div className="mt-4 text-sm text-gray-500">
        {filteredArtikel?.length} {filteredArtikel?.length === 1 ? 'Artikel' : 'Artikel'} gefunden
      </div>

      <div className="mt-4 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                    Artikelnummer
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Kategorie
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Beschreibung
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Einheit
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                    <span className="sr-only">Aktionen</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredArtikel?.map((artikel) => (
                  <tr key={artikel.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                      {artikel.artikelnummer}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {artikel.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {artikel.kategorie}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {artikel.beschreibung}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {artikel.einheit}
                    </td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                      <Link
                        href={`/artikel/${artikel.id}`}
                        className="text-[#023770] hover:text-[#034694]"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
} 