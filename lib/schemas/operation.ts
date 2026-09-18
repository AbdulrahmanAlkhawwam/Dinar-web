import { z } from 'zod';

import { currencySchema } from './currency';

export { paginated } from './pagination';

export const operationTypeSchema = z.enum(['INCOME', 'EXPENSE']);

export const operationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: operationTypeSchema,
  title: z.string(),
  // `String?` in Prisma. The OpenAPI document calls this an object, which is
  // wrong, and is why these schemas are written by hand.
  description: z.string().nullable(),
  /** Denominated in `currency`, not USD. */
  amount: z.number(),
  currencyId: z.string(),
  /** The rate as it stood when the operation was written. */
  exchangeRate: z.number(),
  amountInUSD: z.number(),
  operationDate: z.string(),
  currency: currencySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Operation = z.infer<typeof operationSchema>;
export type OperationType = z.infer<typeof operationTypeSchema>;
