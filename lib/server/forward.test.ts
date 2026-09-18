import { describe, expect, test } from 'vitest';

import { forward } from './forward';

const BASE = 'https://api.test/api/v1';

interface Call {
  url: string;
  method: string;
  auth: string | null;
  body: string | null;
}

/**
 * A stand-in for the Dinar API. Each route answers from a queue, so a test
 * can say "the first /operations call is a 401, the second is a 200".
 */
function fakeApi(routes: Record<string, Response[]>) {
  const calls: Call[] = [];

  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      method: init?.method ?? 'GET',
      auth: headers.get('authorization'),
      body: typeof init?.body === 'string' ? init.body : null,
    });

    const path = url.slice(BASE.length).split('?')[0];
    const next = routes[path]?.shift();
    if (!next) {
      throw new Error(`Unexpected call to ${path}`);
    }
    return next;
  };

  return { fetchImpl, calls };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

describe('forward', () => {
  test('passes a successful response straight through with the bearer', async () => {
    const api = fakeApi({ '/operations': [json(200, { data: [] })] });

    const result = await forward({
      baseUrl: BASE,
      path: '/operations?page=2',
      method: 'GET',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      fetch: api.fetchImpl,
    });

    expect(result.response.status).toBe(200);
    expect(result.clearSession).toBe(false);
    expect(result.accessToken).toBeUndefined();
    expect(api.calls).toEqual([
      {
        url: `${BASE}/operations?page=2`,
        method: 'GET',
        auth: 'Bearer access-1',
        body: null,
      },
    ]);
  });

  test('refreshes once on a 401 and replays the request with the new token', async () => {
    const api = fakeApi({
      '/operations': [
        json(401, { message: 'Unauthorized', statusCode: 401 }),
        json(201, { id: 'op1' }),
      ],
      '/auth/refresh': [json(200, { accessToken: 'access-2' })],
    });

    const result = await forward({
      baseUrl: BASE,
      path: '/operations',
      method: 'POST',
      body: '{"title":"Salary"}',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      fetch: api.fetchImpl,
    });

    expect(result.response.status).toBe(201);
    expect(result.accessToken).toBe('access-2');
    expect(result.clearSession).toBe(false);

    const [original, refresh, replay] = api.calls;
    expect(original.auth).toBe('Bearer access-1');
    expect(refresh).toMatchObject({
      url: `${BASE}/auth/refresh`,
      method: 'POST',
      body: '{"refreshToken":"refresh-1"}',
    });
    // Same method and body, new token — a create must not become a GET.
    expect(replay).toMatchObject({
      method: 'POST',
      auth: 'Bearer access-2',
      body: '{"title":"Salary"}',
    });
  });

  test('ends the session when the refresh token is rejected', async () => {
    const api = fakeApi({
      '/operations': [json(401, { message: 'Unauthorized' })],
      '/auth/refresh': [json(401, { message: 'Invalid or expired refresh token' })],
    });

    const result = await forward({
      baseUrl: BASE,
      path: '/operations',
      method: 'GET',
      accessToken: 'access-1',
      refreshToken: 'stale',
      fetch: api.fetchImpl,
    });

    expect(result.response.status).toBe(401);
    expect(result.clearSession).toBe(true);
    expect(api.calls).toHaveLength(2); // no replay
  });

  test('ends the session on a 401 when there is no refresh token to try', async () => {
    const api = fakeApi({ '/operations': [json(401, {})] });

    const result = await forward({
      baseUrl: BASE,
      path: '/operations',
      method: 'GET',
      accessToken: 'access-1',
      fetch: api.fetchImpl,
    });

    expect(result.clearSession).toBe(true);
    expect(api.calls).toHaveLength(1);
  });

  test('does not loop when the fresh token is refused too', async () => {
    const api = fakeApi({
      '/operations': [json(401, {}), json(401, {})],
      '/auth/refresh': [json(200, { accessToken: 'access-2' })],
    });

    const result = await forward({
      baseUrl: BASE,
      path: '/operations',
      method: 'GET',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      fetch: api.fetchImpl,
    });

    expect(result.response.status).toBe(401);
    expect(result.clearSession).toBe(true);
    expect(api.calls).toHaveLength(3);
  });

  // 403 means "signed in, but not an admin". Refreshing cannot fix that, and
  // treating it as a 401 would log admins-in-waiting out.
  test('leaves a 403 alone', async () => {
    const api = fakeApi({
      '/products': [json(403, { message: 'Administrator access is required' })],
    });

    const result = await forward({
      baseUrl: BASE,
      path: '/products',
      method: 'POST',
      body: '{}',
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
      fetch: api.fetchImpl,
    });

    expect(result.response.status).toBe(403);
    expect(result.clearSession).toBe(false);
    expect(api.calls).toHaveLength(1);
  });

  test('sends no authorization header when signed out', async () => {
    const api = fakeApi({ '/products': [json(200, { data: [] })] });

    await forward({
      baseUrl: BASE,
      path: '/products',
      method: 'GET',
      fetch: api.fetchImpl,
    });

    expect(api.calls[0].auth).toBeNull();
  });
});
