import { toIsoDate } from '@/lib/dates';

export type RangePreset = 'week' | 'month' | 'year';

export interface DateRange {
  from: string;
  to: string;
  /** How the chart buckets the range. */
  unit: 'day' | 'month';
}

/** The whole current week (Monday–Sunday), month or year, in local time. */
export function presetRange(preset: RangePreset, now = new Date()): DateRange {
  const y = now.getFullYear();
  const m = now.getMonth();

  if (preset === 'year') {
    return { from: `${y}-01-01`, to: `${y}-12-31`, unit: 'month' };
  }

  if (preset === 'month') {
    return {
      from: toIsoDate(new Date(y, m, 1)),
      to: toIsoDate(new Date(y, m + 1, 0)),
      unit: 'day',
    };
  }

  // getDay(): Sunday is 0. Shift so Monday is 0 and Sunday is 6.
  const sinceMonday = (now.getDay() + 6) % 7;
  const monday = new Date(y, m, now.getDate() - sinceMonday);
  const sunday = new Date(y, m, monday.getDate() + 6);
  return { from: toIsoDate(monday), to: toIsoDate(sunday), unit: 'day' };
}
