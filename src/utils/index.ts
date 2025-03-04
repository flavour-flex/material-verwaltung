import { format as fnsFormat } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

export function formatDate(date: string | Date, formatStr = 'dd.MM.yyyy'): string {
  return fnsFormat(new Date(date), formatStr, { locale: de });
}

export function handleApiError(error: any): void {
  console.error('API Error:', error);
  toast.error(error.message || 'Ein Fehler ist aufgetreten');
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
} 