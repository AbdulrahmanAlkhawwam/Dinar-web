import { describe, expect, test } from 'vitest';

import { decodeJwt, secondsUntilExpiry } from './jwt';

function token(payload: object): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

describe('decodeJwt', () => {
  test('reads the claims the Dinar API signs', () => {
    const claims = decodeJwt(
      token({ sub: 'u1', email: 'a@b.co', role: 'ADMIN', exp: 1_900_000_000 }),
    );

    expect(claims).toEqual({
      sub: 'u1',
      email: 'a@b.co',
      role: 'ADMIN',
      exp: 1_900_000_000,
    });
  });

  test('returns null for something that is not a JWT', () => {
    expect(decodeJwt('not-a-token')).toBeNull();
  });

  test('returns null when the payload is not JSON', () => {
    expect(decodeJwt('aGVhZGVy.bm90IGpzb24.sig')).toBeNull();
  });

  test('returns null when a required claim is missing', () => {
    expect(decodeJwt(token({ sub: 'u1', exp: 1_900_000_000 }))).toBeNull();
  });
});

describe('secondsUntilExpiry', () => {
  const now = 1_800_000_000_000; // ms

  test('counts down to exp', () => {
    const t = token({ sub: 'u', email: 'e', role: 'USER', exp: 1_800_000_900 });

    expect(secondsUntilExpiry(t, now)).toBe(900);
  });

  test('never goes negative for an expired token', () => {
    const t = token({ sub: 'u', email: 'e', role: 'USER', exp: 1_799_999_000 });

    expect(secondsUntilExpiry(t, now)).toBe(0);
  });

  test('is zero for an unreadable token', () => {
    expect(secondsUntilExpiry('garbage', now)).toBe(0);
  });
});
