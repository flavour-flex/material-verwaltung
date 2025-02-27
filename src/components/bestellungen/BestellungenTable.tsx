import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from 'next/link';
import type { BestellungType } from '@/types';

interface Props {
  bestellungen: BestellungType[];
}

export default function BestellungenTable({ bestellungen }: Props) {
  const getVersandteMenge = (bestellung: BestellungType) => {
    // Bei teilweise versendeten oder offenen Bestellungen die tatsächlich versandte Menge
    return bestellung.bestellung_artikel?.reduce((sum, pos) => 
      sum + (pos.versandte_menge || 0), 0
    ) || 0;
  };

  const getGesamtMenge = (bestellung: BestellungType) => {
    return bestellung.bestellung_artikel?.reduce((sum, pos) => 
      sum + pos.menge, 0
    ) || 0;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
              Standort
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Status
            </th>
            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
              Datum
            </th>
            <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
              Versandt
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {bestellungen.map((bestellung) => (
            <tr key={bestellung.id}>
              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                <Link href={`/bestellungen/${bestellung.id}`} className="text-indigo-600 hover:text-indigo-900">
                  {bestellung.standort?.name}
                </Link>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {bestellung.status}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                {format(new Date(bestellung.created_at), 'dd.MM.yyyy', { locale: de })}
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">
                {getVersandteMenge(bestellung)} / {getGesamtMenge(bestellung)} versendet
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 