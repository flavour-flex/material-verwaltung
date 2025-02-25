import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Artikel } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const KATEGORIEN = [
  'Hardware',
  'Software',
  'Verbrauchsmaterial',
  'Büromaterial',
  'Sonstiges',
];

const EINHEITEN = [
  'Stück',
  'Packung',
  'Karton',
  'Meter',
  'Liter',
];

// Schema muss vor useForm definiert werden
const artikelSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  artikelnummer: z.string().min(1, 'Artikelnummer ist erforderlich'),
  beschreibung: z.string().optional(),
  kategorie: z.string().min(1, 'Kategorie ist erforderlich'),
  einheit: z.string().min(1, 'Einheit ist erforderlich'),
  serviceintervall_monate: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().nullable()
  ),
  wechselintervall_jahre: z.preprocess(
    (val) => (val === '' ? null : Number(val)),
    z.number().nullable()
  ),
  standort_id: z.string().nullable(),
  verantwortlicher: z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
    telefon: z.string().min(1, 'Telefon ist erforderlich'),
  }).nullable(),
}).refine((data) => {
  if (data.kategorie === 'Hardware') {
    return (
      data.serviceintervall_monate !== null &&
      data.serviceintervall_monate > 0 &&
      data.wechselintervall_jahre !== null &&
      data.wechselintervall_jahre > 0 &&
      data.standort_id !== null &&
      data.verantwortlicher !== null
    );
  }
  return true;
}, {
  message: "Für Hardware-Artikel müssen alle Felder ausgefüllt werden",
  path: ["kategorie"], // Zeigt die Fehlermeldung bei der Kategorie an
});

type ArtikelFormData = z.infer<typeof artikelSchema>;

interface ArtikelFormProps {
  initialData?: Partial<Artikel>;
  onSubmit: (data: ArtikelFormData) => Promise<void>;
}

export default function ArtikelForm({ initialData, onSubmit }: ArtikelFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ArtikelFormData>({
    resolver: zodResolver(artikelSchema),
    defaultValues: {
      name: initialData?.name || '',
      artikelnummer: initialData?.artikelnummer || '',
      beschreibung: initialData?.beschreibung || '',
      kategorie: initialData?.kategorie || '',
      einheit: initialData?.einheit || '',
      serviceintervall_monate: initialData?.serviceintervall_monate || null,
      wechselintervall_jahre: initialData?.wechselintervall_jahre || null,
      standort_id: initialData?.standort_id || null,
      verantwortlicher: initialData?.verantwortlicher || null,
    },
    mode: 'onChange',
  });

  const selectedKategorie = watch('kategorie');
  const isHardware = selectedKategorie === 'Hardware';

  // Standorte laden
  const { data: standorte, isLoading: standorteLoading } = useQuery({
    queryKey: ['standorte'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('standorte')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Artikel Details</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bitte füllen Sie alle erforderlichen Felder aus.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          <div className="sm:col-span-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1">
              <input
                type="text"
                {...register('name')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="artikelnummer" className="block text-sm font-medium text-gray-700">
              Artikelnummer
            </label>
            <div className="mt-1">
              <input
                type="text"
                {...register('artikelnummer')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.artikelnummer && (
                <p className="mt-1 text-sm text-red-600">{errors.artikelnummer.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-6">
            <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700">
              Beschreibung
            </label>
            <div className="mt-1">
              <textarea
                {...register('beschreibung')}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.beschreibung && (
                <p className="mt-1 text-sm text-red-600">{errors.beschreibung.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="kategorie" className="block text-sm font-medium text-gray-700">
              Kategorie
            </label>
            <div className="mt-1">
              <select
                {...register('kategorie')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Bitte wählen</option>
                {KATEGORIEN.map(kategorie => (
                  <option key={kategorie} value={kategorie}>
                    {kategorie}
                  </option>
                ))}
              </select>
              {errors.kategorie && (
                <p className="mt-1 text-sm text-red-600">{errors.kategorie.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-3">
            <label htmlFor="einheit" className="block text-sm font-medium text-gray-700">
              Einheit
            </label>
            <div className="mt-1">
              <select
                {...register('einheit')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">Bitte wählen</option>
                {EINHEITEN.map(einheit => (
                  <option key={einheit} value={einheit}>
                    {einheit}
                  </option>
                ))}
              </select>
              {errors.einheit && (
                <p className="mt-1 text-sm text-red-600">{errors.einheit.message}</p>
              )}
            </div>
          </div>

          {isHardware && (
            <>
              <div className="sm:col-span-3">
                <label htmlFor="serviceintervall_monate" className="block text-sm font-medium text-gray-700">
                  Service-Intervall (Monate) *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    required
                    {...register('serviceintervall_monate', { 
                      valueAsNumber: true,
                      required: 'Service-Intervall ist erforderlich' 
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.serviceintervall_monate && (
                    <p className="mt-1 text-sm text-red-600">{errors.serviceintervall_monate.message}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="wechselintervall_jahre" className="block text-sm font-medium text-gray-700">
                  Wechsel-Intervall (Jahre) *
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    required
                    {...register('wechselintervall_jahre', { 
                      valueAsNumber: true,
                      required: 'Wechsel-Intervall ist erforderlich' 
                    })}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  {errors.wechselintervall_jahre && (
                    <p className="mt-1 text-sm text-red-600">{errors.wechselintervall_jahre.message}</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="standort_id" className="block text-sm font-medium text-gray-700">
                  Standort *
                </label>
                <div className="mt-1">
                  <select
                    required
                    {...register('standort_id')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    disabled={standorteLoading}
                  >
                    <option value="">Bitte wählen</option>
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
              </div>

              <div className="sm:col-span-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Verantwortlicher *</h4>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <div className="mt-1">
                      <input
                        type="text"
                        required
                        {...register('verantwortlicher.name')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      {errors.verantwortlicher?.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.verantwortlicher.name.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                    <div className="mt-1">
                      <input
                        type="email"
                        required
                        {...register('verantwortlicher.email')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      {errors.verantwortlicher?.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.verantwortlicher.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefon</label>
                    <div className="mt-1">
                      <input
                        type="tel"
                        required
                        {...register('verantwortlicher.telefon')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                      {errors.verantwortlicher?.telefon && (
                        <p className="mt-1 text-sm text-red-600">{errors.verantwortlicher.telefon.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {isSubmitting ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </form>
  );
} 