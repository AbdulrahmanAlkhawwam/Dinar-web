import { z } from 'zod';

import { userSchema } from './user';

export const loginResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

/** No refresh token — the BFF logs in straight after registering. */
export const registerResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
});

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
});

export const loginInputSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string({ error: 'Enter your password' }).min(1, 'Enter your password'),
});

export const registerInputSchema = z.object({
  name: z.string({ error: 'Enter your name' }).trim().min(1, 'Enter your name'),
  email: z.email('Enter a valid email address'),
  // RegisterDto: @MinLength(8)
  password: z
    .string({ error: 'Choose a password' })
    .min(8, 'Use at least 8 characters'),
});

export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
