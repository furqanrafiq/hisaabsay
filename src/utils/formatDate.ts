import { format, isToday, isYesterday, parseISO } from 'date-fns';

export function formatDisplayDate(isoDate: string): string {
  const d = parseISO(isoDate);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd MMM yyyy');
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy');
}

export function getMonthKey(date: Date): string {
  return format(date, 'yyyy-MM');
}

export function formatShortDate(isoDate: string): string {
  return format(parseISO(isoDate), 'dd MMM');
}
