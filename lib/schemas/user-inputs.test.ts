import { describe, expect, test } from 'vitest';

import { newUserInputSchema, userEditInputSchema } from './user-inputs';

describe('newUserInputSchema', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', password: 'longenough', role: 'USER' };

  // Accounts are created through /auth/register, so RegisterDto's rules apply.
  test('needs a password of at least 8 characters', () => {
    expect(newUserInputSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
  });

  test('normalises the email the way the DTO does', () => {
    expect(newUserInputSchema.parse({ ...valid, email: '  Jane@Example.COM ' }).email).toBe(
      'jane@example.com',
    );
  });

  test('accepts only the two roles', () => {
    expect(newUserInputSchema.safeParse({ ...valid, role: 'OWNER' }).success).toBe(false);
  });
});

describe('userEditInputSchema', () => {
  const valid = { name: 'Jane', email: 'jane@example.com', phone: '', avatar: '', role: 'ADMIN' };

  // @IsOptional skips validation for null, and Prisma stores it as null, so
  // null is how a phone number or avatar gets cleared.
  test('sends emptied optional fields as null', () => {
    expect(userEditInputSchema.parse(valid)).toMatchObject({ phone: null, avatar: null });
  });

  test('keeps a phone number as typed, trimmed', () => {
    expect(userEditInputSchema.parse({ ...valid, phone: ' +963 11 000 0000 ' }).phone).toBe(
      '+963 11 000 0000',
    );
  });

  test('rejects an avatar that is not an http(s) URL', () => {
    expect(userEditInputSchema.safeParse({ ...valid, avatar: 'ftp://x' }).success).toBe(false);
  });

  // PATCH /users stores a password without hashing it, which would stop that
  // user signing in. The edit form therefore never sends one.
  test('has no password field', () => {
    expect(userEditInputSchema.parse({ ...valid, password: 'x' })).not.toHaveProperty('password');
  });
});
