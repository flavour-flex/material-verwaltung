import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import Layout from '@/components/Layout';

const einstellungenSchema = z.object({
  hauptlager_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  service_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  service_benachrichtigung_tage: z.number().min(1, 'Muss mindestens 1 Tag sein'),
  wechsel_email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
  wechsel_benachrichtigung_monate: z.number().min(1, 'Muss mindestens 1 Monat sein'),
});

type EinstellungenFormData = z.infer<typeof einstellungenSchema>;

export default function EinstellungenPage() {
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

  const { register, handleSubmit, formState: { errors } } = useForm<EinstellungenFormData>({
    resolver: zodResolver(einstellungenSchema),
    defaultValues: {
      hauptlager_email: einstellungen?.hauptlager_email || '',
      service_email: einstellungen?.service_email || '',
      service_benachrichtigung_tage: einstellungen?.service_benachrichtigung_tage || 14,
      wechsel_email: einstellungen?.wechsel_email || '',
      wechsel_benachrichtigung_monate: einstellungen?.wechsel_benachrichtigung_monate || 3,
    },
  });

  const updateEinstellungen = useMutation({
    mutationFn: async (data: EinstellungenFormData) => {
      const { error } = await supabase
        .from('einstellungen')
        .update(data)
        .eq('id', einstellungen?.id);

      if (error) throw error;
    },
  });

  if (isLoading) return <div>Laden...</div>;

  return (
    <Layout>
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Einstellungen
          </h2>
        </div>
      </div>

      <div className="mt-8">
        <form onSubmit={handleSubmit(updateEinstellungen.mutateAsync)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hauptlager E-Mail-Adresse
            </label>
            <div className="mt-1">
              <input
                type="email"
                {...register('hauptlager_email')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.hauptlager_email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.hauptlager_email.message}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              An diese E-Mail-Adresse werden Benachrichtigungen über neue Bestellungen gesendet.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Service E-Mail-Adresse
            </label>
            <div className="mt-1">
              <input
                type="email"
                {...register('service_email')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.service_email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.service_email.message}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              An diese E-Mail-Adresse werden Benachrichtigungen über anstehende Service-Intervalle gesendet.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vorlaufzeit für Service-Benachrichtigungen (Tage)
            </label>
            <div className="mt-1">
              <input
                type="number"
                {...register('service_benachrichtigung_tage', { valueAsNumber: true })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.service_benachrichtigung_tage && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.service_benachrichtigung_tage.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Hardware-Wechsel E-Mail-Adresse
            </label>
            <div className="mt-1">
              <input
                type="email"
                {...register('wechsel_email')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.wechsel_email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.wechsel_email.message}
                </p>
              )}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              An diese E-Mail-Adresse werden Benachrichtigungen über anstehende Hardware-Wechsel gesendet.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vorlaufzeit für Wechsel-Benachrichtigungen (Monate)
            </label>
            <div className="mt-1">
              <input
                type="number"
                {...register('wechsel_benachrichtigung_monate', { valueAsNumber: true })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.wechsel_benachrichtigung_monate && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.wechsel_benachrichtigung_monate.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
} 