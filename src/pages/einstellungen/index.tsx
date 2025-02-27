import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { useEffect } from 'react';

const einstellungenSchema = z.object({
  hauptlager_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  service_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  service_benachrichtigung_tage: z.number().min(1, 'Muss mindestens 1 Tag sein'),
  wechsel_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  wechsel_benachrichtigung_tage: z.number().min(1, 'Muss mindestens 1 Tag sein'),
  mindestbestand_benachrichtigung: z.boolean(),
  mindestbestand_email: z.string().email('Gültige E-Mail-Adresse erforderlich')
});

type EinstellungenFormData = z.infer<typeof einstellungenSchema>;

export default function EinstellungenPage() {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EinstellungenFormData>({
    resolver: zodResolver(einstellungenSchema)
  });

  // Einstellungen laden
  const { data: einstellungen, isLoading } = useQuery({
    queryKey: ['einstellungen'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('einstellungen')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Formular mit aktuellen Werten füllen
  useEffect(() => {
    if (einstellungen) {
      reset(einstellungen);
    }
  }, [einstellungen, reset]);

  // Einstellungen aktualisieren
  const updateEinstellungen = useMutation({
    mutationFn: async (data: Partial<EinstellungenFormData>) => {
      const { error } = await supabase
        .from('einstellungen')
        .update(data)
        .eq('id', einstellungen?.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['einstellungen']);
      toast.success('Einstellungen gespeichert');
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern der Einstellungen');
      console.error('Update error:', error);
    },
  });

  // Einzelne Einstellung aktualisieren
  const handleUpdateSingle = (key: keyof EinstellungenFormData, value: any) => {
    updateEinstellungen.mutate({ [key]: value });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Einstellungen</h1>

        <div className="mt-8 max-w-3xl">
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                {/* Hauptlager E-Mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hauptlager E-Mail-Adresse
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="email"
                      {...register('hauptlager_email')}
                      className="flex-1 min-w-0 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmit((data) => 
                        handleUpdateSingle('hauptlager_email', data.hauptlager_email)
                      )()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Speichern
                    </button>
                  </div>
                  {errors.hauptlager_email && (
                    <p className="mt-2 text-sm text-red-600">{errors.hauptlager_email.message}</p>
                  )}
                </div>

                {/* Service E-Mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service E-Mail-Adresse
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="email"
                      {...register('service_email')}
                      className="flex-1 min-w-0 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmit((data) => 
                        handleUpdateSingle('service_email', data.service_email)
                      )()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Speichern
                    </button>
                  </div>
                  {errors.service_email && (
                    <p className="mt-2 text-sm text-red-600">{errors.service_email.message}</p>
                  )}
                </div>

                {/* Service-Benachrichtigung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service-Benachrichtigung (Tage im Voraus)
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      {...register('service_benachrichtigung_tage', { valueAsNumber: true })}
                      className="flex-1 min-w-0 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmit((data) => 
                        handleUpdateSingle('service_benachrichtigung_tage', data.service_benachrichtigung_tage)
                      )()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Speichern
                    </button>
                  </div>
                  {errors.service_benachrichtigung_tage && (
                    <p className="mt-2 text-sm text-red-600">{errors.service_benachrichtigung_tage.message}</p>
                  )}
                </div>

                {/* Wechsel E-Mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Wechsel E-Mail-Adresse
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="email"
                      {...register('wechsel_email')}
                      className="flex-1 min-w-0 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmit((data) => 
                        handleUpdateSingle('wechsel_email', data.wechsel_email)
                      )()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Speichern
                    </button>
                  </div>
                  {errors.wechsel_email && (
                    <p className="mt-2 text-sm text-red-600">{errors.wechsel_email.message}</p>
                  )}
                </div>

                {/* Wechsel-Benachrichtigung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Wechsel-Benachrichtigung (Tage im Voraus)
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="number"
                      {...register('wechsel_benachrichtigung_tage', { valueAsNumber: true })}
                      className="flex-1 min-w-0 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmit((data) => 
                        handleUpdateSingle('wechsel_benachrichtigung_tage', data.wechsel_benachrichtigung_tage)
                      )()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Speichern
                    </button>
                  </div>
                  {errors.wechsel_benachrichtigung_tage && (
                    <p className="mt-2 text-sm text-red-600">{errors.wechsel_benachrichtigung_tage.message}</p>
                  )}
                </div>

                {/* Mindestbestand E-Mail */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Mindestbestand E-Mail-Adresse
                  </label>
                  <div className="mt-1 flex rounded-md shadow-sm">
                    <input
                      type="email"
                      {...register('mindestbestand_email')}
                      className="flex-1 min-w-0 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleSubmit((data) => 
                        handleUpdateSingle('mindestbestand_email', data.mindestbestand_email)
                      )()}
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Speichern
                    </button>
                  </div>
                  {errors.mindestbestand_email && (
                    <p className="mt-2 text-sm text-red-600">{errors.mindestbestand_email.message}</p>
                  )}
                </div>

                {/* Mindestbestand-Benachrichtigung */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register('mindestbestand_benachrichtigung')}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Benachrichtigung bei Unterschreitung des Mindestbestands
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubmit((data) => 
                      handleUpdateSingle('mindestbestand_benachrichtigung', data.mindestbestand_benachrichtigung)
                    )()}
                    className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Speichern
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 