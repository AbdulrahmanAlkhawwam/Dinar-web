/**
 * The page offers one "sort by" choice; QueryProductsDto takes it as two
 * fields, `sort` and `order`.
 */
export const SORTS = [
  { value: 'newest', label: 'Newest', sort: 'createdAt', order: 'desc' },
  { value: 'oldest', label: 'Oldest', sort: 'createdAt', order: 'asc' },
  { value: 'price-asc', label: 'Price: low to high', sort: 'price', order: 'asc' },
  { value: 'price-desc', label: 'Price: high to low', sort: 'price', order: 'desc' },
  { value: 'title-asc', label: 'Name: A to Z', sort: 'title', order: 'asc' },
  { value: 'title-desc', label: 'Name: Z to A', sort: 'title', order: 'desc' },
] as const;

export type SortChoice = (typeof SORTS)[number]['value'];

export interface ProductFilters {
  page: number;
  sort: SortChoice;
  search?: string;
  categoryId?: string;
}

const DEFAULT_SORT: SortChoice = 'newest';

export function parseFilters(params: URLSearchParams): ProductFilters {
  const filters: ProductFilters = { page: 1, sort: DEFAULT_SORT };

  const page = Number(params.get('page'));
  if (Number.isInteger(page) && page >= 1) {
    filters.page = page;
  }

  const sort = SORTS.find((s) => s.value === params.get('sort'));
  if (sort) {
    filters.sort = sort.value;
  }

  const search = params.get('search')?.trim();
  if (search) {
    filters.search = search;
  }

  const categoryId = params.get('categoryId');
  if (categoryId) {
    filters.categoryId = categoryId;
  }

  return filters;
}

export function apiQuery(filters: ProductFilters, limit: number): string {
  const sort = SORTS.find((s) => s.value === filters.sort) ?? SORTS[0];
  const params = new URLSearchParams([
    ['page', String(filters.page)],
    ['limit', String(limit)],
    ['sort', sort.sort],
    ['order', sort.order],
  ]);
  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  return `?${params.toString()}`;
}

/** The page's own URL; defaults are left out so the plain link stays clean. */
export function toSearchParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.page > 1) params.set('page', String(filters.page));
  if (filters.sort !== DEFAULT_SORT) params.set('sort', filters.sort);
  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId) params.set('categoryId', filters.categoryId);
  return params;
}
