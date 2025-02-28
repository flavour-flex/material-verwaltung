import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface WarenbestandSectionProps {
  standortId: string;
}

interface BestandsArtikel {
  artikel: {
    id: string;
    name: string;
    artikelnummer: string;
    kategorie: string;
    einheit: string;
  };
  menge: number;
  lagerorte: Map<string, number>;
}

export default function WarenbestandSection({ standortId }: WarenbestandSectionProps) {
  const bestand = new Map<string, BestandsArtikel>();

  const { data: wareneingaenge = [], isLoading } = useQuery({
    queryKey: ['standort-warenbestand', standortId],
    queryFn: async () => {
      const { data, error } = await supabase
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
        .eq('standort_id', standortId);

      if (error) throw error;
      return data || [];
    },
  });

  // Warenbestand berechnen
  if (Array.isArray(wareneingaenge)) {
    wareneingaenge.forEach((eingang) => {
      if (!eingang?.artikel) return;

      const artikelId = eingang.artikel.id;
      const current = bestand.get(artikelId) || {
        artikel: eingang.artikel,
        menge: 0,
        lagerorte: new Map<string, number>()
      };

      current.menge += eingang.menge;

      // Lagerorte verarbeiten
      if (Array.isArray(eingang.lagerorte)) {
        eingang.lagerorte.forEach((lo: { lagerort: string; menge: number }) => {
          const aktuellerBestand = current.lagerorte.get(lo.lagerort) || 0;
          current.lagerorte.set(lo.lagerort, aktuellerBestand + lo.menge);
        });
      }

      bestand.set(artikelId, current);
    });
  }

  // Artikel nach Kategorien gruppieren
  const verbrauchsmaterial = Array.from(bestand.values())
    .filter(artikel => artikel.artikel.kategorie === 'Verbrauchsmaterial')
    .sort((a, b) => a.artikel.name.localeCompare(b.artikel.name));

  const bueromaterial = Array.from(bestand.values())
    .filter(artikel => artikel.artikel.kategorie === 'Büromaterial')
    .sort((a, b) => a.artikel.name.localeCompare(b.artikel.name));

  if (isLoading) return <LoadingSpinner />;

  const renderArtikelTabelle = (artikel: BestandsArtikel[]) => (
    <table className="min-w-full divide-y divide-gray-300">
      <thead>
        <tr>
          <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
            Artikel
          </th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
            Artikelnummer
          </th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
            Gesamtbestand
          </th>
          <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
            Lagerorte
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {artikel.map((artikel) => (
          <tr key={artikel.artikel.id}>
            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
              {artikel.artikel.name}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {artikel.artikel.artikelnummer}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {artikel.menge} {artikel.artikel.einheit}
            </td>
            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {Array.from(artikel.lagerorte.entries()).map(([lagerort, menge]) => (
                <div key={lagerort}>
                  {lagerort}: {menge} {artikel.artikel.einheit}
                </div>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="mt-4">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h2 className="text-xl font-semibold text-gray-900">Warenbestand</h2>
          <p className="mt-2 text-sm text-gray-700">
            Aktueller Bestand aller Artikel am Standort
          </p>
        </div>
      </div>
      
      <div className="mt-8 space-y-8">
        {/* Verbrauchsmaterial */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Verbrauchsmaterial</h3>
          <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                {verbrauchsmaterial.length > 0 ? (
                  renderArtikelTabelle(verbrauchsmaterial)
                ) : (
                  <p className="text-sm text-gray-500">Kein Verbrauchsmaterial vorhanden</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Büromaterial */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Büromaterial</h3>
          <div className="flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                {bueromaterial.length > 0 ? (
                  renderArtikelTabelle(bueromaterial)
                ) : (
                  <p className="text-sm text-gray-500">Kein Büromaterial vorhanden</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 