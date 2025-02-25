import { addMonths, addYears, format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export function calculateNextServiceDate(createdAt: string, intervalMonths: number): Date {
  const installDate = parseISO(createdAt);
  const now = new Date();
  let nextService = installDate;

  while (nextService <= now) {
    nextService = addMonths(nextService, intervalMonths);
  }

  return nextService;
}

export function calculateNextChangeDate(createdAt: string, intervalYears: number): Date {
  const installDate = parseISO(createdAt);
  return addYears(installDate, intervalYears);
}

export function formatDate(date: Date): string {
  return format(date, 'dd.MM.yyyy', { locale: de });
}

export function getStatusColor(date: Date): string {
  const now = new Date();
  const monthDiff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30);
  
  if (monthDiff < 0) return 'text-red-600';
  if (monthDiff < 1) return 'text-yellow-600';
  return 'text-green-600';
} 