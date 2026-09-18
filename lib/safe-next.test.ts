import { describe, expect, test } from 'vitest';

import { safeNext } from './safe-next';

describe('safeNext', () => {
  test('keeps a same-site path', () => {
    expect(safeNext('/operations?page=2')).toBe('/operations?page=2');
  });

  test.each([
    ['protocol-relative', '//evil.example'],
    ['absolute', 'https://evil.example'],
    ['backslash trick', '/\\evil.example'],
    ['javascript', 'javascript:alert(1)'],
    ['relative', 'operations'],
  ])('rejects a %s URL', (_kind, value) => {
    expect(safeNext(value)).toBe('/');
  });

  test('defaults to home when absent', () => {
    expect(safeNext(undefined)).toBe('/');
  });

  test('takes the first value when the param repeats', () => {
    expect(safeNext(['/products', '//evil.example'])).toBe('/products');
  });
});
