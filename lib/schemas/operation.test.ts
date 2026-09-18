import { describe, expect, test } from 'vitest';

import { operationSchema, paginated } from './operation';

// Captured from the shape OperationsService returns: `include: { currency: true }`
// with the rate and USD conversion snapshotted at write time.
const apiRow = {
  id: 'cm2v8t3hl0000nmn0m0h1abcd',
  userId: 'cm2v8t3hl0000nmn0m0h1user',
  type: 'EXPENSE',
  title: 'Groceries',
  description: 'Weekly shop',
  amount: 140000,
  currencyId: 'cm2v8t3hl0000nmn0m0h1curr',
  exchangeRate: 14000,
  amountInUSD: 10,
  operationDate: '2026-08-22T00:00:00.000Z',
  currency: {
    id: 'cm2v8t3hl0000nmn0m0h1curr',
    code: 'SYP',
    name: 'Syrian Pound',
    symbol: 'SP',
    exchangeRateFromUSD: 14000,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  createdAt: '2026-08-22T10:00:00.000Z',
  updatedAt: '2026-08-22T10:00:00.000Z',
};

describe('operationSchema', () => {
  test('parses a row as the API returns it', () => {
    const parsed = operationSchema.parse(apiRow);

    expect(parsed.type).toBe('EXPENSE');
    expect(parsed.amountInUSD).toBe(10);
    expect(parsed.currency.code).toBe('SYP');
  });

  // Prisma types description as `String?`, and the OpenAPI document wrongly
  // calls it an object. A null here must not throw.
  test('accepts a null description', () => {
    const parsed = operationSchema.parse({ ...apiRow, description: null });

    expect(parsed.description).toBeNull();
  });

  test('rejects a type outside the OperationType enum', () => {
    expect(() => operationSchema.parse({ ...apiRow, type: 'TRANSFER' })).toThrow();
  });

  test('rejects a row missing its USD snapshot', () => {
    const { amountInUSD: _omitted, ...withoutSnapshot } = apiRow;

    expect(() => operationSchema.parse(withoutSnapshot)).toThrow();
  });
});

describe('paginated', () => {
  test('parses the data and meta envelope', () => {
    const parsed = paginated(operationSchema).parse({
      data: [apiRow],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    expect(parsed.data).toHaveLength(1);
    expect(parsed.meta.totalPages).toBe(1);
  });

  test('rejects a bare array, which is the other envelope', () => {
    expect(() => paginated(operationSchema).parse([apiRow])).toThrow();
  });
});
