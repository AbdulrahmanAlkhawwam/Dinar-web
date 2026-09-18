const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const cents = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 140000 → "140,000"; 12.5 → "12.50". */
export function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? whole.format(amount) : cents.format(amount);
}

/** An amount in its own currency, e.g. "SP 140,000". */
export function formatMoney(amount: number, symbol: string): string {
  return `${symbol} ${formatAmount(amount)}`;
}

/**
 * A USD figure. Weak currencies convert to fractions of a cent, and "$0.00"
 * would read as nothing, so those say "<$0.01" instead.
 */
export function formatUsd(amount: number): string {
  const magnitude = Math.abs(amount);
  if (magnitude > 0 && magnitude < 0.005) {
    return amount < 0 ? '>-$0.01' : '<$0.01';
  }
  const formatted = `$${cents.format(magnitude)}`;
  return amount < 0 ? `-${formatted}` : formatted;
}

/** CurrenciesService.convertCurrencyToUsd: 1 USD buys `rate` units. */
export function toUsd(amount: number, rate: number): number {
  if (!(rate > 0)) {
    throw new Error(`Exchange rate must be positive, got ${rate}`);
  }
  return amount / rate;
}
