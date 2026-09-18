import { describe, expect, test } from 'vitest';

import { sessionCookieOptions } from './cookies';

describe('sessionCookieOptions', () => {
  test('keeps tokens away from page scripts', () => {
    const options = sessionCookieOptions(900, true);

    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe('lax');
    expect(options.path).toBe('/');
    expect(options.maxAge).toBe(900);
  });

  test('is secure in production', () => {
    expect(sessionCookieOptions(900, true).secure).toBe(true);
  });

  // `next dev` serves plain http://localhost, where a secure cookie is never
  // sent back and sign-in would silently fail.
  test('is not secure on plain-http development', () => {
    expect(sessionCookieOptions(900, false).secure).toBe(false);
  });
});
