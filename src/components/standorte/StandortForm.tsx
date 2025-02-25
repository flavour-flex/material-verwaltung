import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Standort } from '@/types';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const standortSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  adresse: z.string().min(1, 'Adresse ist erforderlich'),
  plz: z.string().min(1, 'PLZ ist erforderlich'),
  stadt: z.string().min(1, 'Stadt ist erforderlich'),
  land: z.string().min(1, 'Land ist erforderlich'),
  verantwortliche: z.array(z.object({
    name: z.string().min(1, 'Name ist erforderlich'),
    email: z.string().email('Gültige E-Mail-Adresse erforderlich'),
    telefon: z.string().min(1, 'Telefon ist erforderlich'),
  })).min(1, 'Mindestens ein Verantwortlicher ist erforderlich'),
});

type StandortFormData = z.infer<typeof standortSchema>;

interface StandortFormProps {
  initialData?: Partial<Standort>;
  onSubmit: (data: StandortFormData) => Promise<void>;
}

export default function StandortForm({ initialData, onSubmit }: StandortFormProps) {
  const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm<StandortFormData>({
    resolver: zodResolver(standortSchema),
    defaultValues: {
      name: initialData?.name || '',
      adresse: initialData?.adresse || '',
      plz: initialData?.plz || '',
      stadt: initialData?.stadt || '',
      land: initialData?.land || '',
      verantwortliche: initialData?.verantwortliche || [{ name: '', email: '', telefon: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "verantwortliche",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">Standort Details</h3>
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

          <div className="sm:col-span-6">
            <label htmlFor="adresse" className="block text-sm font-medium text-gray-700">
              Adresse
            </label>
            <div className="mt-1">
              <input
                type="text"
                {...register('adresse')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.adresse && (
                <p className="mt-1 text-sm text-red-600">{errors.adresse.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="plz" className="block text-sm font-medium text-gray-700">
              PLZ
            </label>
            <div className="mt-1">
              <input
                type="text"
                {...register('plz')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.plz && (
                <p className="mt-1 text-sm text-red-600">{errors.plz.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="stadt" className="block text-sm font-medium text-gray-700">
              Stadt
            </label>
            <div className="mt-1">
              <input
                type="text"
                {...register('stadt')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.stadt && (
                <p className="mt-1 text-sm text-red-600">{errors.stadt.message}</p>
              )}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="land" className="block text-sm font-medium text-gray-700">
              Land
            </label>
            <div className="mt-1">
              <input
                type="text"
                {...register('land')}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.land && (
                <p className="mt-1 text-sm text-red-600">{errors.land.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">Verantwortliche</h3>
            <p className="mt-1 text-sm text-gray-500">
              Fügen Sie mindestens einen Verantwortlichen hinzu.
            </p>
          </div>
          <button
            type="button"
            onClick={() => append({ name: '', email: '', telefon: '' })}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Verantwortlichen hinzufügen
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="relative border rounded-lg p-4 bg-gray-50">
              {index > 0 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                  <span className="sr-only">Verantwortlichen entfernen</span>
                </button>
              )}
              
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      {...register(`verantwortliche.${index}.name`)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.verantwortliche?.[index]?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.verantwortliche[index]?.name?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    E-Mail
                  </label>
                  <div className="mt-1">
                    <input
                      type="email"
                      {...register(`verantwortliche.${index}.email`)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.verantwortliche?.[index]?.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.verantwortliche[index]?.email?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Telefon
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      {...register(`verantwortliche.${index}.telefon`)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                    {errors.verantwortliche?.[index]?.telefon && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.verantwortliche[index]?.telefon?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {errors.verantwortliche && !Array.isArray(errors.verantwortliche) && (
            <p className="mt-2 text-sm text-red-600">
              {errors.verantwortliche.message}
            </p>
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