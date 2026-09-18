import { isIsoDate } from '@/lib/dates';
import type { OperationType } from '@/lib/schemas/operation';

export interface OperationFilters {
  page: number;
  type?: OperationType;
  from?: string;
  to?: string;
}

/**
 * Reads filters from the URL, dropping anything the API would reject with a
 * 400 — a hand-edited or stale link degrades to "no filter" instead.
 */
export function parseFilters(params: URLSearchParams): OperationFilters {
  const filters: OperationFilters = { page: 1 };

  const page = Number(params.get('page'));
  if (Number.isInteger(page) && page >= 1) {
    filters.page = page;
  }

  const type = params.get('type');
  if (type === 'INCOME' || type === 'EXPENSE') {
    filters.type = type;
  }

  for (const key of ['from', 'to'] as const) {
    const value = params.get(key);
    if (value && isIsoDate(value)) {
      filters[key] = value;
    }
  }

  return filters;
}

function entries(filters: OperationFilters): [string, string][] {
  return [
    ['type', filters.type],
    ['from', filters.from],
    ['to', filters.to],
  ].filter((entry): entry is [string, string] => entry[1] !== undefined);
}

/** The query string for GET /operations. */
export function apiQuery(filters: OperationFilters, limit: number): string {
  const params = new URLSearchParams([
    ['page', String(filters.page)],
    ['limit', String(limit)],
    ...entries(filters),
  ]);
  return `?${params.toString()}`;
}

/** The page's own URL. Page 1 is left out so the default link stays clean. */
export function toSearchParams(filters: OperationFilters): URLSearchParams {
  const params = new URLSearchParams(entries(filters));
  if (filters.page > 1) {
    params.set('page', String(filters.page));
  }
  return params;
}
