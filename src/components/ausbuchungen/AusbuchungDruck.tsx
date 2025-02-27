import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AusbuchungGruppe } from '@/types';

interface Props {
  gruppe: AusbuchungGruppe;
}

export default function AusbuchungDruck({ gruppe }: Props) {
  return (
    <div className="print-only p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold">Ausbuchungsbeleg</h1>
        <p className="text-gray-500">
          {format(new Date(gruppe.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
        </p>
      </div>

      <div className="mb-6">
        <p><strong>Standort:</strong> {gruppe.standort.name}</p>
        <p><strong>Referenz:</strong> {gruppe.referenz || '-'}</p>
      </div>

      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-50">
            <th className="border px-4 py-2 text-left">Artikel</th>
            <th className="border px-4 py-2 text-left">Artikelnummer</th>
            <th className="border px-4 py-2 text-right">Menge</th>
            <th className="border px-4 py-2 text-left">Lagerort</th>
          </tr>
        </thead>
        <tbody>
          {gruppe.positionen.map((position) => (
            <tr key={position.id}>
              <td className="border px-4 py-2">{position.artikel.name}</td>
              <td className="border px-4 py-2">{position.artikel.artikelnummer}</td>
              <td className="border px-4 py-2 text-right">
                {position.menge} {position.artikel.einheit || 'Stück'}
              </td>
              <td className="border px-4 py-2">{position.lagerort}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8">
        <p className="text-sm text-gray-500">Ausgedruckt am: {format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
      </div>
    </div>
  );
} 