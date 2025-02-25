import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Hardware, Standort } from '@/types';

const hardwareSchema = z.object({
  artikel_id: z.string().min(1, 'Artikel ist erforderlich'),
  serviceintervall_monate: z.number().min(1, 'Serviceintervall ist erforderlich'),
  wechselintervall_jahre: z.number().min(1, 'Wechselintervall ist erforderlich'),
  standort_id: z.string().min(1, 'Standort ist erforderlich'),
  verantwortlicher: z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    email: z.string().email('Gültige E-Mail erforderlich'),
  }),
});

type HardwareFormData = z.infer<typeof hardwareSchema>;

interface Props {
  initialData?: Hardware;
  onSubmit: (data: HardwareFormData) => Promise<void>;
}

export default function HardwareForm({ initialData, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<HardwareFormData>({
    resolver: zodResolver(hardwareSchema),
    defaultValues: initialData
  });

  const { data: standorte } = useQuery<Standort[]>({
    queryKey: ['standorte'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standorte')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: artikel } = useQuery({
    queryKey: ['artikel'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artikel')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Artikel</label>
        <select
          {...register('artikel_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Bitte wählen...</option>
          {artikel?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.artikelnummer})
            </option>
          ))}
        </select>
        {errors.artikel_id && (
          <p className="mt-1 text-sm text-red-600">{errors.artikel_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Serviceintervall (Monate)</label>
        <input
          type="number"
          {...register('serviceintervall_monate', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.serviceintervall_monate && (
          <p className="mt-1 text-sm text-red-600">{errors.serviceintervall_monate.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Wechselintervall (Jahre)</label>
        <input
          type="number"
          {...register('wechselintervall_jahre', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.wechselintervall_jahre && (
          <p className="mt-1 text-sm text-red-600">{errors.wechselintervall_jahre.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Standort</label>
        <select
          {...register('standort_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="">Bitte wählen...</option>
          {standorte?.map((standort) => (
            <option key={standort.id} value={standort.id}>
              {standort.name}
            </option>
          ))}
        </select>
        {errors.standort_id && (
          <p className="mt-1 text-sm text-red-600">{errors.standort_id.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Verantwortlicher Name</label>
        <input
          type="text"
          {...register('verantwortlicher.name')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.verantwortlicher?.name && (
          <p className="mt-1 text-sm text-red-600">{errors.verantwortlicher.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Verantwortlicher E-Mail</label>
        <input
          type="email"
          {...register('verantwortlicher.email')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.verantwortlicher?.email && (
          <p className="mt-1 text-sm text-red-600">{errors.verantwortlicher.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Speichern
      </button>
    </form>
  );
} 