import { calendarDate } from '@/lib/dates';

import type { SummarizableOperation } from './aggregate';
import type { DateRange } from './range';

export interface Bucket {
  /** YYYY-MM-DD for days, YYYY-MM for months. */
  key: string;
  income: number;
  expense: number;
}

function keysBetween({ from, to, unit }: DateRange): string[] {
  const keys: string[] = [];
  const cursor = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);

  while (cursor <= end) {
    const iso = cursor.toISOString();
    keys.push(unit === 'day' ? iso.slice(0, 10) : iso.slice(0, 7));
    if (unit === 'day') {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    } else {
      cursor.setUTCMonth(cursor.getUTCMonth() + 1, 1);
    }
  }
  return keys;
}

/**
 * Income and expense per day or month across the whole range. Empty periods
 * get a zero bucket, so a chart's x-axis is the calendar and not just the
 * days that happened to have activity.
 */
export function bucketize(
  operations: readonly SummarizableOperation[],
  range: DateRange,
): Bucket[] {
  const buckets = new Map<string, Bucket>(
    keysBetween(range).map((key) => [key, { key, income: 0, expense: 0 }]),
  );

  for (const operation of operations) {
    const date = calendarDate(operation.operationDate);
    const bucket = buckets.get(range.unit === 'day' ? date : date.slice(0, 7));
    if (!bucket) {
      continue;
    }
    if (operation.type === 'INCOME') {
      bucket.income += operation.amountInUSD;
    } else {
      bucket.expense += operation.amountInUSD;
    }
  }

  return [...buckets.values()];
}

interface Page<T> {
  data: T[];
  meta: { totalPages: number };
}

/**
 * Collects every page of a paginated endpoint, up to a cap. The API has no
 * aggregation endpoint, so summaries are built from rows; past the cap the
 * caller learns the totals would be incomplete rather than silently low.
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<Page<T>>,
  maxPages = 50,
): Promise<{ rows: T[]; truncated: boolean }> {
  const rows: T[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await fetchPage(page);
    rows.push(...result.data);
    totalPages = result.meta.totalPages;
    page += 1;
  } while (page <= totalPages && page <= maxPages);

  return { rows, truncated: totalPages > maxPages };
}
