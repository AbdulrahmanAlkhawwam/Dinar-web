import { z } from 'zod';

import { isIsoDate } from '@/lib/dates';

import { operationTypeSchema } from './operation';

/** CreateCurrencyDto: code is trimmed, upper-cased and exactly 3 long. */
export const currencyInputSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Use the 3-letter ISO code, like USD'),
  name: z.string().trim().min(1, 'Enter a name'),
  symbol: z.string().trim().min(1, 'Enter a symbol'),
  exchangeRateFromUSD: z
    .number({ error: 'Enter a rate' })
    .positive('The rate must be above zero'),
});

export type CurrencyInput = z.infer<typeof currencyInputSchema>;

/** CreateOperationDto. `amount` must be positive; direction lives in `type`. */
export const operationInputSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title'),
  description: z.string().trim(),
  amount: z.number({ error: 'Enter an amount' }).positive('The amount must be above zero'),
  currencyId: z.string().min(1, 'Choose a currency'),
  type: operationTypeSchema,
  operationDate: z.string().refine(isIsoDate, 'Choose a date'),
});

export type OperationInput = z.infer<typeof operationInputSchema>;
