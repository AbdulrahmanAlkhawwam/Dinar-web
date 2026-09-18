import { describe, expect, test } from 'vitest';

import { summarize } from './aggregate';
import type { SummarizableOperation } from './aggregate';

function operation(
  overrides: Partial<SummarizableOperation> = {},
): SummarizableOperation {
  return {
    type: 'INCOME',
    amountInUSD: 100,
    operationDate: '2026-09-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('summarize', () => {
  test('reports zeros for an empty ledger', () => {
    expect(summarize([])).toEqual({
      income: 0,
      expense: 0,
      net: 0,
      count: 0,
    });
  });

  test('separates income from expense and nets the difference', () => {
    const summary = summarize([
      operation({ type: 'INCOME', amountInUSD: 1000 }),
      operation({ type: 'EXPENSE', amountInUSD: 250 }),
      operation({ type: 'EXPENSE', amountInUSD: 150 }),
    ]);

    expect(summary).toEqual({
      income: 1000,
      expense: 400,
      net: 600,
      count: 3,
    });
  });

  test('goes negative when expenses exceed income', () => {
    const summary = summarize([
      operation({ type: 'INCOME', amountInUSD: 100 }),
      operation({ type: 'EXPENSE', amountInUSD: 175 }),
    ]);

    expect(summary.net).toBe(-75);
  });

  // The API stores amount in the operation's own currency and amountInUSD as
  // the converted snapshot. Summing `amount` across currencies would add
  // dinars to dollars, so the totals must come from amountInUSD alone.
  test('totals the USD snapshot, not the raw amount', () => {
    const summary = summarize([
      { type: 'INCOME', amountInUSD: 0.5, operationDate: '2026-09-01' },
      { type: 'INCOME', amountInUSD: 1.25, operationDate: '2026-09-02' },
    ]);

    expect(summary.income).toBe(1.75);
  });

  test('tolerates floating point drift in the total', () => {
    const summary = summarize([
      operation({ type: 'INCOME', amountInUSD: 0.1 }),
      operation({ type: 'INCOME', amountInUSD: 0.2 }),
    ]);

    expect(summary.income).toBe(0.3);
  });
});
