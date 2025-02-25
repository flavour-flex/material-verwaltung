import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useEffect } from 'react';

// Schema für Verbrauchsmaterial
const verbrauchsmaterialSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  artikelnummer: z.string().min(1, 'Artikelnummer ist erforderlich'),
  beschreibung: z.string().optional(),
  kategorie: z.literal('Verbrauchsmaterial'),
  mindestbestand: z.number().min(0, 'Mindestbestand muss positiv sein'),
  einheit: z.string().min(1, 'Einheit ist erforderlich'),
});

// Erweitertes Schema für Hardware
const hardwareSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  artikelnummer: z.string().min(1, 'Artikelnummer ist erforderlich'),
  beschreibung: z.string().optional(),
  kategorie: z.literal('Hardware'),
  serviceintervall_monate: z.number().min(1, 'Serviceintervall ist erforderlich'),
  wechselintervall_jahre: z.number().min(1, 'Wechselintervall ist erforderlich'),
  verantwortlicher: z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    email: z.string().email('Gültige E-Mail erforderlich'),
    telefon: z.string().min(1, 'Telefon ist erforderlich'),
  }),
});

type VerbrauchsmaterialForm = z.infer<typeof verbrauchsmaterialSchema>;
type HardwareForm = z.infer<typeof hardwareSchema>;

export default function ArtikelBearbeitenPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();

  // Artikel-Daten laden
  const { data: artikel, isLoading } = useQuery({
    queryKey: ['artikel', id],
    queryFn: async () => {
      const { data: artikelData, error: artikelError } = await supabase
        .from('artikel')
        .select('*')
        .eq('id', id)
        .single();

      if (artikelError) throw artikelError;

      // Wenn es Hardware ist, zusätzliche Daten laden
      if (artikelData.kategorie === 'Hardware') {
        const { data: hardwareData, error: hardwareError } = await supabase
          .from('hardware')
          .select('*')
          .eq('artikel_id', id)
          .single();

        if (hardwareError) throw hardwareError;

        return {
          ...artikelData,
          ...hardwareData
        };
      }

      return artikelData;
    },
    enabled: !!id
  });

  // Separate Forms für Hardware und Verbrauchsmaterial
  const { register: registerHardware, handleSubmit: handleSubmitHardware, formState: { errors: errorsHardware }, reset: resetHardware } = useForm<HardwareForm>({
    resolver: zodResolver(hardwareSchema),
  });

  const { register: registerVerbrauchsmaterial, handleSubmit: handleSubmitVerbrauchsmaterial, formState: { errors: errorsVerbrauchsmaterial }, reset: resetVerbrauchsmaterial } = useForm<VerbrauchsmaterialForm>({
    resolver: zodResolver(verbrauchsmaterialSchema),
  });

  // Formular mit Daten füllen, sobald sie geladen sind
  useEffect(() => {
    if (artikel) {
      if (artikel.kategorie === 'Hardware') {
        resetHardware({
          name: artikel.name,
          artikelnummer: artikel.artikelnummer,
          beschreibung: artikel.beschreibung || '',
          kategorie: 'Hardware',
          serviceintervall_monate: artikel.serviceintervall_monate,
          wechselintervall_jahre: artikel.wechselintervall_jahre,
          verantwortlicher: artikel.verantwortlicher
        });
      } else {
        resetVerbrauchsmaterial({
          name: artikel.name,
          artikelnummer: artikel.artikelnummer,
          beschreibung: artikel.beschreibung || '',
          kategorie: 'Verbrauchsmaterial',
          mindestbestand: artikel.mindestbestand,
          einheit: artikel.einheit
        });
      }
    }
  }, [artikel, resetHardware, resetVerbrauchsmaterial]);

  const updateArtikel = useMutation({
    mutationFn: async (data: VerbrauchsmaterialForm | HardwareForm) => {
      // Erst den Basis-Artikel aktualisieren
      const { error: artikelError } = await supabase
        .from('artikel')
        .update({
          name: data.name,
          artikelnummer: data.artikelnummer,
          beschreibung: data.beschreibung,
          kategorie: data.kategorie,
          ...(data.kategorie === 'Verbrauchsmaterial' && {
            mindestbestand: (data as VerbrauchsmaterialForm).mindestbestand,
            einheit: (data as VerbrauchsmaterialForm).einheit,
          })
        })
        .eq('id', id);

      if (artikelError) throw artikelError;

      // Wenn es Hardware ist, auch Hardware-spezifische Daten aktualisieren
      if (data.kategorie === 'Hardware') {
        const hardwareData = data as HardwareForm;
        const { error: hardwareError } = await supabase
          .from('hardware')
          .update({
            serviceintervall_monate: hardwareData.serviceintervall_monate,
            wechselintervall_jahre: hardwareData.wechselintervall_jahre,
            verantwortlicher: hardwareData.verantwortlicher
          })
          .eq('artikel_id', id);

        if (hardwareError) throw hardwareError;
      }
    },
    onSuccess: () => {
      toast.success('Artikel erfolgreich aktualisiert');
      queryClient.invalidateQueries(['artikel']);
      router.push('/artikel');
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren des Artikels');
      console.error('Update error:', error);
    }
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <div className="flex items-center gap-4">
              <Link
                href="/artikel"
                className="group flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeftIcon className="mr-1 h-5 w-5" />
                Zurück
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Artikel bearbeiten
              </h1>
            </div>
          </div>
        </div>

        <div className="mt-8">
          {artikel?.kategorie === 'Hardware' ? (
            <form onSubmit={handleSubmitHardware((data) => updateArtikel.mutate(data))} className="space-y-6">
              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      {...registerHardware('name')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsHardware.name && (
                      <p className="mt-2 text-sm text-red-600">{errorsHardware.name.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Artikelnummer</label>
                    <input
                      type="text"
                      {...registerHardware('artikelnummer')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsHardware.artikelnummer && (
                      <p className="mt-2 text-sm text-red-600">{errorsHardware.artikelnummer.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                    <textarea
                      {...registerHardware('beschreibung')}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Serviceintervall (Monate)</label>
                    <input
                      type="number"
                      {...registerHardware('serviceintervall_monate')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsHardware.serviceintervall_monate && (
                      <p className="mt-2 text-sm text-red-600">{errorsHardware.serviceintervall_monate.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Wechselintervall (Jahre)</label>
                    <input
                      type="number"
                      {...registerHardware('wechselintervall_jahre')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsHardware.wechselintervall_jahre && (
                      <p className="mt-2 text-sm text-red-600">{errorsHardware.wechselintervall_jahre.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Verantwortlicher</h3>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input
                          type="text"
                          {...registerHardware('verantwortlicher.name')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                        <input
                          type="email"
                          {...registerHardware('verantwortlicher.email')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefon</label>
                        <input
                          type="tel"
                          {...registerHardware('verantwortlicher.telefon')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/artikel"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Abbrechen
                </Link>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Speichern
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitVerbrauchsmaterial((data) => updateArtikel.mutate(data))} className="space-y-6">
              <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      {...registerVerbrauchsmaterial('name')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsVerbrauchsmaterial.name && (
                      <p className="mt-2 text-sm text-red-600">{errorsVerbrauchsmaterial.name.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Artikelnummer</label>
                    <input
                      type="text"
                      {...registerVerbrauchsmaterial('artikelnummer')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsVerbrauchsmaterial.artikelnummer && (
                      <p className="mt-2 text-sm text-red-600">{errorsVerbrauchsmaterial.artikelnummer.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                    <textarea
                      {...registerVerbrauchsmaterial('beschreibung')}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Mindestbestand</label>
                    <input
                      type="number"
                      {...registerVerbrauchsmaterial('mindestbestand')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsVerbrauchsmaterial.mindestbestand && (
                      <p className="mt-2 text-sm text-red-600">{errorsVerbrauchsmaterial.mindestbestand.message}</p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Einheit</label>
                    <input
                      type="text"
                      {...registerVerbrauchsmaterial('einheit')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errorsVerbrauchsmaterial.einheit && (
                      <p className="mt-2 text-sm text-red-600">{errorsVerbrauchsmaterial.einheit.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Link
                  href="/artikel"
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Abbrechen
                </Link>
                <button
                  type="submit"
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Speichern
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
} 