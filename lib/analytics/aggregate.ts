export type OperationType = 'INCOME' | 'EXPENSE';

/** The only fields a summary needs, so callers can pass partial rows in tests. */
export interface SummarizableOperation {
  type: OperationType;
  amountInUSD: number;
  operationDate: string;
}

export interface LedgerSummary {
  income: number;
  expense: number;
  net: number;
  count: number;
}

/**
 * Enough places to keep a small USD conversion intact — the API can return
 * figures like 0.0714285714 — while dropping the IEEE drift that turns
 * 0.1 + 0.2 into 0.30000000000000004.
 */
const PRECISION = 8;

function round(value: number): number {
  return Number(value.toFixed(PRECISION));
}

/**
 * Totals a ledger in USD.
 *
 * `amount` is denominated in the operation's own currency, so summing it
 * across currencies would add dinars to dollars. `amountInUSD` is the
 * conversion the API snapshotted at write time, and is the only field that
 * can be added up.
 */
export function summarize(
  operations: readonly SummarizableOperation[],
): LedgerSummary {
  let income = 0;
  let expense = 0;

  for (const operation of operations) {
    if (operation.type === 'INCOME') {
      income += operation.amountInUSD;
    } else {
      expense += operation.amountInUSD;
    }
  }

  income = round(income);
  expense = round(expense);

  return {
    income,
    expense,
    net: round(income - expense),
    count: operations.length,
  };
}
