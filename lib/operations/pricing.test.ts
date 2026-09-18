import { describe, expect, test } from 'vitest';

import { pricePreview } from './pricing';

const currencies = [
  { id: 'usd', exchangeRateFromUSD: 1 },
  { id: 'syp', exchangeRateFromUSD: 15000 },
];

describe('pricePreview for a new operation', () => {
  test('converts at the currency’s current rate', () => {
    expect(pricePreview({ amount: 30000, currencyId: 'syp' }, currencies)).toEqual({
      rate: 15000,
      amountInUSD: 2,
      reprices: false,
    });
  });

  test('has no figure until the amount is a positive number', () => {
    expect(pricePreview({ amount: Number.NaN, currencyId: 'syp' }, currencies)).toEqual({
      rate: 15000,
      amountInUSD: null,
      reprices: false,
    });
  });

  test('is null when no currency is chosen', () => {
    expect(pricePreview({ amount: 10, currencyId: '' }, currencies)).toBeNull();
  });
});

// OperationsService.update keeps `operation.exchangeRate` unless currencyId
// changes. Only a currency switch picks up today's rate.
describe('pricePreview when editing', () => {
  const original = { currencyId: 'syp', exchangeRate: 14000 };

  test('keeps the original rate when only the amount changes', () => {
    expect(
      pricePreview({ amount: 28000, currencyId: 'syp' }, currencies, original),
    ).toEqual({ rate: 14000, amountInUSD: 2, reprices: false });
  });

  test('uses today’s rate, and says so, when the currency changes', () => {
    expect(
      pricePreview({ amount: 5, currencyId: 'usd' }, currencies, original),
    ).toEqual({ rate: 1, amountInUSD: 5, reprices: true });
  });
});
