import { describe, expect, test } from 'vitest';

import { SORTS, apiQuery, parseFilters, toSearchParams } from './filters';

describe('parseFilters', () => {
  test('reads every filter from the URL', () => {
    expect(
      parseFilters(new URLSearchParams('page=2&search=phone&categoryId=c1&sort=price-asc')),
    ).toEqual({ page: 2, search: 'phone', categoryId: 'c1', sort: 'price-asc' });
  });

  test('defaults to newest first on page 1', () => {
    expect(parseFilters(new URLSearchParams())).toEqual({ page: 1, sort: 'newest' });
  });

  test.each([
    ['page=-1', { page: 1, sort: 'newest' }],
    ['sort=popularity', { page: 1, sort: 'newest' }],
    ['search=%20%20', { page: 1, sort: 'newest' }],
  ])('drops an invalid value in %s', (query, expected) => {
    expect(parseFilters(new URLSearchParams(query))).toEqual(expected);
  });

  test('trims the search term', () => {
    expect(parseFilters(new URLSearchParams('search=%20phone%20')).search).toBe('phone');
  });
});

describe('apiQuery', () => {
  // QueryProductsDto takes sort and order as two fields; the page offers
  // them as one choice.
  test('splits the sort choice into the API’s sort and order', () => {
    expect(apiQuery({ page: 1, sort: 'price-asc', search: 'tv' }, 20)).toBe(
      '?page=1&limit=20&sort=price&order=asc&search=tv',
    );
  });

  test('covers every sort the page offers', () => {
    for (const sort of SORTS) {
      expect(apiQuery({ page: 1, sort: sort.value }, 20)).toMatch(
        /sort=(price|title|createdAt)&order=(asc|desc)/,
      );
    }
  });
});

describe('toSearchParams', () => {
  test('leaves the defaults out of the URL', () => {
    expect(toSearchParams({ page: 1, sort: 'newest' }).toString()).toBe('');
  });

  test('round-trips through parseFilters', () => {
    const filters = { page: 3, sort: 'title-desc' as const, categoryId: 'c9', search: 'lamp' };

    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });
});
