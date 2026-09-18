import { z } from 'zod';

import { isHttpUrl } from '@/lib/url';

import { roleSchema } from './user';

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address'));

/** Blank becomes null: @IsOptional skips null, and Prisma stores it as null. */
const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value));

/**
 * A new account. It is created through /auth/register — POST /users stores
 * the password unhashed, which leaves an account that can never sign in — so
 * RegisterDto's rules apply.
 */
export const newUserInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  email,
  password: z.string({ error: 'Choose a password' }).min(8, 'Use at least 8 characters'),
  role: roleSchema,
});

export type NewUserInput = z.infer<typeof newUserInputSchema>;

/**
 * An edit. Deliberately without a password: PATCH /users stores whatever it
 * is given as-is, so setting one here would lock the user out.
 */
export const userEditInputSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name'),
  email,
  phone: optionalText,
  avatar: optionalText.refine((value) => value === null || isHttpUrl(value), 'Enter a full http(s) URL'),
  role: roleSchema,
});

export type UserEditFormValues = z.input<typeof userEditInputSchema>;
export type UserEditInput = z.output<typeof userEditInputSchema>;
