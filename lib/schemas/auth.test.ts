import { describe, expect, test } from 'vitest';

import {
  loginResponseSchema,
  refreshResponseSchema,
  registerResponseSchema,
} from './auth';

const user = {
  id: 'u1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: null,
  avatar: null,
  role: 'USER',
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

describe('auth responses', () => {
  test('login carries both tokens', () => {
    const parsed = loginResponseSchema.parse({
      user,
      accessToken: 'a',
      refreshToken: 'r',
    });

    expect(parsed.refreshToken).toBe('r');
    expect(parsed.user.role).toBe('USER');
  });

  // AuthService.register returns `{ user, accessToken }` only. The BFF relies
  // on this schema accepting that shape so it knows to log in afterwards.
  test('register carries no refresh token', () => {
    const parsed = registerResponseSchema.parse({ user, accessToken: 'a' });

    expect(parsed).not.toHaveProperty('refreshToken');
  });

  test('refresh carries only a new access token', () => {
    expect(refreshResponseSchema.parse({ accessToken: 'a2' })).toEqual({
      accessToken: 'a2',
    });
  });

  test('rejects a role outside the Role enum', () => {
    expect(() =>
      loginResponseSchema.parse({
        user: { ...user, role: 'OWNER' },
        accessToken: 'a',
        refreshToken: 'r',
      }),
    ).toThrow();
  });
});
