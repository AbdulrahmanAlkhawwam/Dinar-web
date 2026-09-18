import { z } from 'zod';

export const roleSchema = z.enum(['USER', 'ADMIN']);

/** The `userSelect` shape — never includes password or refresh token. */
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  avatar: z.string().nullable(),
  role: roleSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof userSchema>;
export type Role = z.infer<typeof roleSchema>;
