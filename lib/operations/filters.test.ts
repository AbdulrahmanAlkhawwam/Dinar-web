import { describe, expect, test } from 'vitest';

import { apiQuery, parseFilters, toSearchParams } from './filters';

describe('parseFilters', () => {
  test('reads every filter from the URL', () => {
    expect(
      parseFilters(
        new URLSearchParams('page=3&type=EXPENSE&from=2026-09-01&to=2026-09-30'),
      ),
    ).toEqual({ page: 3, type: 'EXPENSE', from: '2026-09-01', to: '2026-09-30' });
  });

  test('defaults to the first page with no filters', () => {
    expect(parseFilters(new URLSearchParams())).toEqual({ page: 1 });
  });

  // A hand-edited URL must not reach the API as a 400.
  test.each([
    ['page=0', { page: 1 }],
    ['page=abc', { page: 1 }],
    ['page=2.5', { page: 1 }],
    ['type=TRANSFER', { page: 1 }],
    ['from=2026-13-40', { page: 1 }],
    ['to=yesterday', { page: 1 }],
  ])('drops an invalid value in %s', (query, expected) => {
    expect(parseFilters(new URLSearchParams(query))).toEqual(expected);
  });
});

describe('apiQuery', () => {
  test('builds the query the API expects, with the page size', () => {
    expect(apiQuery({ page: 2, type: 'INCOME', from: '2026-09-01' }, 20)).toBe(
      '?page=2&limit=20&type=INCOME&from=2026-09-01',
    );
  });
});

describe('toSearchParams', () => {
  test('omits the first page so the default URL stays clean', () => {
    expect(toSearchParams({ page: 1, type: 'EXPENSE' }).toString()).toBe(
      'type=EXPENSE',
    );
  });

  test('round-trips through parseFilters', () => {
    const filters = { page: 4, type: 'INCOME' as const, to: '2026-09-30' };

    expect(parseFilters(toSearchParams(filters))).toEqual(filters);
  });
});
