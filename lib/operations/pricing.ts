import { toUsd } from '@/lib/money';

export interface PricePreview {
  /** The rate the API will store for this operation. */
  rate: number;
  /** Null until the amount is a positive number. */
  amountInUSD: number | null;
  /** True when saving will replace the rate the operation was written at. */
  reprices: boolean;
}

/**
 * What the API will record, before the form is sent.
 *
 * Mirrors OperationsService: a new operation takes its currency's current
 * rate. An edit keeps the rate it was written at — even if the amount
 * changes — unless the currency changes, which pulls in today's rate.
 */
export function pricePreview(
  draft: { amount: number; currencyId: string },
  currencies: readonly { id: string; exchangeRateFromUSD: number }[],
  original?: { currencyId: string; exchangeRate: number },
): PricePreview | null {
  const currency = currencies.find((c) => c.id === draft.currencyId);
  if (!currency) {
    return null;
  }

  const keepsOriginalRate = original?.currencyId === draft.currencyId;
  const rate = keepsOriginalRate ? original.exchangeRate : currency.exchangeRateFromUSD;

  return {
    rate,
    amountInUSD:
      Number.isFinite(draft.amount) && draft.amount > 0 ? toUsd(draft.amount, rate) : null,
    reprices: original !== undefined && !keepsOriginalRate,
  };
}
