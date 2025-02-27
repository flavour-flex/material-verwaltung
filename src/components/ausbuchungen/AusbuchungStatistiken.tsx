import { useMemo } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { AusbuchungGruppe } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { de } from 'date-fns/locale';

// Chart.js Komponenten registrieren
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  ausbuchungen: AusbuchungGruppe[];
}

export default function AusbuchungStatistiken({ ausbuchungen }: Props) {
  // Statistiken berechnen
  const stats = useMemo(() => {
    const referenzStats = new Map<string, number>();
    const artikelStats = new Map<string, number>();
    const monatlicheStats = new Map<string, number>();
    
    ausbuchungen.forEach(gruppe => {
      // Referenz-Statistiken
      const referenzKey = gruppe.referenz || 'Ohne Referenz';
      const referenzMenge = gruppe.positionen.reduce((sum, pos) => sum + pos.menge, 0);
      referenzStats.set(
        referenzKey, 
        (referenzStats.get(referenzKey) || 0) + referenzMenge
      );

      // Artikel-Statistiken
      gruppe.positionen.forEach(pos => {
        const artikelKey = pos.artikel.name;
        artikelStats.set(
          artikelKey,
          (artikelStats.get(artikelKey) || 0) + pos.menge
        );
      });

      // Monatliche Statistiken
      const monat = format(new Date(gruppe.created_at), 'yyyy-MM');
      monatlicheStats.set(
        monat,
        (monatlicheStats.get(monat) || 0) + gruppe.positionen.reduce((sum, pos) => sum + pos.menge, 0)
      );
    });

    return {
      referenzStats: new Map([...referenzStats.entries()].sort((a, b) => b[1] - a[1])),
      artikelStats: new Map([...artikelStats.entries()].sort((a, b) => b[1] - a[1])),
      monatlicheStats
    };
  }, [ausbuchungen]);

  // Daten für die Charts vorbereiten
  const referenzChartData = {
    labels: [...stats.referenzStats.keys()].slice(0, 10),
    datasets: [{
      label: 'Menge nach Referenz',
      data: [...stats.referenzStats.values()].slice(0, 10),
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: 'rgb(99, 102, 241)',
      borderWidth: 1
    }]
  };

  const artikelChartData = {
    labels: [...stats.artikelStats.keys()].slice(0, 5),
    datasets: [{
      label: 'Top 5 Artikel',
      data: [...stats.artikelStats.values()].slice(0, 5),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
        'rgba(75, 192, 192, 0.5)',
        'rgba(153, 102, 255, 0.5)',
      ]
    }]
  };

  // Letzte 6 Monate für Trend
  const letzteMonateLabels = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return format(date, 'MMM yyyy', { locale: de });
  }).reverse();

  const trendChartData = {
    labels: letzteMonateLabels,
    datasets: [{
      label: 'Monatlicher Verbrauch',
      data: letzteMonateLabels.map(monat => {
        const date = new Date(monat);
        const key = format(date, 'yyyy-MM');
        return stats.monatlicheStats.get(key) || 0;
      }),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
      fill: false
    }]
  };

  return (
    <div className="mt-8 space-y-8">
      <h2 className="text-lg font-medium text-gray-900">Statistiken</h2>
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Top 10 Referenzen nach Verbrauch */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Top 10 Referenzen nach Verbrauch</h3>
          <Bar 
            data={referenzChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
              }
            }}
          />
        </div>

        {/* Top 5 meist ausgebuchte Artikel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Top 5 Artikel</h3>
          <Pie 
            data={artikelChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' }
              }
            }}
          />
        </div>

        {/* Verbrauchstrend */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Verbrauchstrend (letzte 6 Monate)</h3>
          <Line 
            data={trendChartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 