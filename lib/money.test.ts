import { describe, expect, test } from 'vitest';

import { formatAmount, formatMoney, formatPrice, formatUsd, toUsd } from './money';

describe('formatAmount', () => {
  test('groups thousands and drops .00 on whole amounts', () => {
    expect(formatAmount(140000)).toBe('140,000');
  });

  test('shows two places when there is a fraction', () => {
    expect(formatAmount(12.5)).toBe('12.50');
  });

  test('rounds to two places', () => {
    expect(formatAmount(0.0714285714)).toBe('0.07');
  });
});

describe('formatMoney', () => {
  test('prefixes the currency symbol', () => {
    expect(formatMoney(140000, 'SP')).toBe('SP 140,000');
  });
});

describe('formatUsd', () => {
  test('always shows cents', () => {
    expect(formatUsd(1234.5)).toBe('$1,234.50');
  });

  test('keeps the sign on a negative balance', () => {
    expect(formatUsd(-75)).toBe('-$75.00');
  });

  // 10 Syrian pounds is about $0.0007. Printing "$0.00" would read as
  // nothing at all.
  test('says "under a cent" rather than $0.00 for a tiny amount', () => {
    expect(formatUsd(0.0007)).toBe('<$0.01');
  });

  test('prints zero plainly', () => {
    expect(formatUsd(0)).toBe('$0.00');
  });
});

describe('toUsd', () => {
  // CurrenciesService.convertCurrencyToUsd: amount / exchangeRateFromUSD.
  test('divides by the rate, as the API does', () => {
    expect(toUsd(140000, 14000)).toBe(10);
  });

  test('refuses a rate that is not positive', () => {
    expect(() => toUsd(10, 0)).toThrow();
  });
});

describe('formatPrice', () => {
  // Prices sit in a column. 89 beside 64.50 makes the eye re-align on every
  // row, so every price shows cents.
  test('always shows two places', () => {
    expect(formatPrice(89)).toBe('89.00');
    expect(formatPrice(64.5)).toBe('64.50');
    expect(formatPrice(1299)).toBe('1,299.00');
  });
});
