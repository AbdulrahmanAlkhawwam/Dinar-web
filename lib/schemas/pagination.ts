import { z } from 'zod';

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/**
 * The envelope `/products` and `/operations` return. `/categories`,
 * `/currencies` and `/users` return a bare array instead, so the two are
 * deliberately not interchangeable.
 */
export function paginated<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  });
}
