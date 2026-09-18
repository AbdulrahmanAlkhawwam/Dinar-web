import { describe, expect, test } from 'vitest';

import { resolveProxyPath } from './proxy-path';

describe('resolveProxyPath', () => {
  test('joins segments and keeps the query string', () => {
    expect(resolveProxyPath(['operations'], '?page=2&type=INCOME')).toBe(
      '/operations?page=2&type=INCOME',
    );
  });

  test('handles nested resources', () => {
    expect(resolveProxyPath(['products', 'cm2abc'], '')).toBe(
      '/products/cm2abc',
    );
  });

  test('encodes segments so an id cannot smuggle a slash', () => {
    expect(resolveProxyPath(['products', 'a/b'], '')).toBe('/products/a%2Fb');
  });

  // Auth goes through /api/auth/*, which keeps tokens in httpOnly cookies.
  // Proxying it here would hand the raw tokens to page JavaScript.
  test.each([['auth', 'login'], ['auth', 'refresh'], ['AUTH', 'login']])(
    'refuses %s/%s',
    (...segments) => {
      expect(resolveProxyPath(segments, '')).toBeNull();
    },
  );

  // fetch() normalises `/api/v1/../x` to `/api/x`, escaping the API prefix.
  test.each([['..', 'secrets'], ['operations', '.'], ['operations', '..']])(
    'refuses a dot segment in %s/%s',
    (...segments) => {
      expect(resolveProxyPath(segments, '')).toBeNull();
    },
  );

  test('refuses an empty path', () => {
    expect(resolveProxyPath([], '')).toBeNull();
  });
});
