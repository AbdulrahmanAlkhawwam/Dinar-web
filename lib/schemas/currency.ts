import { z } from 'zod';

export const currencySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  symbol: z.string(),
  /** How much of this currency one US dollar buys. */
  exchangeRateFromUSD: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Currency = z.infer<typeof currencySchema>;
