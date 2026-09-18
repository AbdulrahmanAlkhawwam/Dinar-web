import { describe, expect, test } from 'vitest';

import { createUser, type ApiCall } from './create-user';

const created = {
  id: 'u9',
  name: 'Jane',
  email: 'jane@example.com',
  phone: null,
  avatar: null,
  role: 'USER',
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
};

function fakeApi(responses: Record<string, { status: number; body: unknown }>) {
  const calls: { method: string; path: string; body: unknown; token?: string }[] = [];
  const call: ApiCall = async (method, path, body, token) => {
    calls.push({ method, path, body, token });
    const response = responses[`${method} ${path}`];
    if (!response) throw new Error(`Unexpected ${method} ${path}`);
    return { ok: response.status < 300, ...response };
  };
  return { call, calls };
}

describe('createUser', () => {
  // POST /users stores the password unhashed, and login bcrypt-compares, so
  // an account made there can never sign in. /auth/register hashes it.
  test('creates the account through register, not POST /users', async () => {
    const api = fakeApi({
      'POST /auth/register': { status: 201, body: { user: created, accessToken: 'new-user-token' } },
    });

    const result = await createUser(
      { name: 'Jane', email: 'jane@example.com', password: 'longenough', role: 'USER' },
      'admin-token',
      api.call,
    );

    expect(result).toEqual({ ok: true, status: 201, body: created });
    expect(api.calls).toEqual([
      {
        method: 'POST',
        path: '/auth/register',
        body: { name: 'Jane', email: 'jane@example.com', password: 'longenough' },
        token: undefined,
      },
    ]);
  });

  test('promotes an admin afterwards, with the admin’s own token', async () => {
    const api = fakeApi({
      'POST /auth/register': { status: 201, body: { user: created, accessToken: 'new-user-token' } },
      'PATCH /users/u9': { status: 200, body: { ...created, role: 'ADMIN' } },
    });

    const result = await createUser(
      { name: 'Jane', email: 'jane@example.com', password: 'longenough', role: 'ADMIN' },
      'admin-token',
      api.call,
    );

    expect(result.body).toMatchObject({ role: 'ADMIN' });
    expect(api.calls[1]).toEqual({
      method: 'PATCH',
      path: '/users/u9',
      body: { role: 'ADMIN' },
      token: 'admin-token',
    });
  });

  test('passes a registration failure straight back', async () => {
    const api = fakeApi({
      'POST /auth/register': {
        status: 409,
        body: { message: 'An account with this email already exists', statusCode: 409 },
      },
    });

    const result = await createUser(
      { name: 'Jane', email: 'jane@example.com', password: 'longenough', role: 'ADMIN' },
      'admin-token',
      api.call,
    );

    expect(result.status).toBe(409);
    expect(api.calls).toHaveLength(1);
  });

  // The account exists at this point; saying "failed" would invite a retry
  // that hits "email already exists".
  test('reports a failed promotion without hiding that the account exists', async () => {
    const api = fakeApi({
      'POST /auth/register': { status: 201, body: { user: created, accessToken: 't' } },
      'PATCH /users/u9': { status: 500, body: { message: 'Internal server error' } },
    });

    const result = await createUser(
      { name: 'Jane', email: 'jane@example.com', password: 'longenough', role: 'ADMIN' },
      'admin-token',
      api.call,
    );

    expect(result.ok).toBe(false);
    expect(result.body).toMatchObject({
      message: expect.stringContaining('was created, but could not be made an administrator'),
    });
  });
});
