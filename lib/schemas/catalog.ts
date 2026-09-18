import { z } from 'zod';

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  // `String?` in Prisma; the OpenAPI document calls it an object.
  image: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Category = z.infer<typeof categorySchema>;

export const productSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  /** A bare number — the API stores no currency for products. */
  price: z.number(),
  images: z.array(z.string()),
  stock: z.number().int(),
  categoryId: z.string(),
  category: categorySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Product = z.infer<typeof productSchema>;
