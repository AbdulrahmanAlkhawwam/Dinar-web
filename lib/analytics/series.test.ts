import { describe, expect, test } from 'vitest';

import { bucketize, fetchAllPages } from './series';

const op = (type: 'INCOME' | 'EXPENSE', amountInUSD: number, operationDate: string) => ({
  type,
  amountInUSD,
  operationDate,
});

describe('bucketize', () => {
  test('gives every day in the range a bucket, empty ones included', () => {
    const series = bucketize([], { from: '2026-09-01', to: '2026-09-03', unit: 'day' });

    expect(series.map((b) => b.key)).toEqual(['2026-09-01', '2026-09-02', '2026-09-03']);
    expect(series.every((b) => b.income === 0 && b.expense === 0)).toBe(true);
  });

  test('adds each operation to its day', () => {
    const series = bucketize(
      [
        op('INCOME', 100, '2026-09-02T00:00:00.000Z'),
        op('EXPENSE', 30, '2026-09-02T00:00:00.000Z'),
        op('EXPENSE', 5, '2026-09-03T00:00:00.000Z'),
      ],
      { from: '2026-09-01', to: '2026-09-03', unit: 'day' },
    );

    expect(series[1]).toMatchObject({ key: '2026-09-02', income: 100, expense: 30 });
    expect(series[2]).toMatchObject({ key: '2026-09-03', income: 0, expense: 5 });
  });

  // The API stores the date the user picked at UTC midnight. Converting that
  // to local time west of Greenwich would move it to the day before.
  test('reads the calendar date the user entered, not a timezone-shifted one', () => {
    const series = bucketize([op('INCOME', 1, '2026-09-02T00:00:00.000Z')], {
      from: '2026-09-01',
      to: '2026-09-02',
      unit: 'day',
    });

    expect(series[1].income).toBe(1);
  });

  test('buckets a year by month', () => {
    const series = bucketize([op('EXPENSE', 40, '2026-03-15T00:00:00.000Z')], {
      from: '2026-01-01',
      to: '2026-12-31',
      unit: 'month',
    });

    expect(series).toHaveLength(12);
    expect(series[2]).toMatchObject({ key: '2026-03', expense: 40 });
  });

  test('ignores operations outside the range', () => {
    const series = bucketize([op('INCOME', 9, '2026-10-01T00:00:00.000Z')], {
      from: '2026-09-01',
      to: '2026-09-30',
      unit: 'day',
    });

    expect(series.reduce((sum, b) => sum + b.income, 0)).toBe(0);
  });
});

describe('fetchAllPages', () => {
  const page = (n: number, totalPages: number) => ({
    data: [`row-${n}`],
    meta: { page: n, limit: 100, total: totalPages, totalPages },
  });

  test('walks every page', async () => {
    const requested: number[] = [];
    const result = await fetchAllPages(async (n) => {
      requested.push(n);
      return page(n, 3);
    });

    expect(requested).toEqual([1, 2, 3]);
    expect(result).toEqual({ rows: ['row-1', 'row-2', 'row-3'], truncated: false });
  });

  test('stops at an empty result', async () => {
    const result = await fetchAllPages(async (n) => page(n, 0));

    expect(result.truncated).toBe(false);
  });

  // Summaries are computed in the browser. Past the cap the figures would be
  // wrong, so the caller is told rather than shown a quiet undercount.
  test('stops at the page cap and reports the totals as incomplete', async () => {
    const result = await fetchAllPages(async (n) => page(n, 10), 4);

    expect(result.rows).toHaveLength(4);
    expect(result.truncated).toBe(true);
  });
});
