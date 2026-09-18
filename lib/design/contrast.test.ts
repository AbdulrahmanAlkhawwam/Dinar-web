import { describe, expect, test } from 'vitest';

import { contrastRatio } from './contrast';

describe('contrastRatio', () => {
  test('gives 21 for black on white, the maximum', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 2);
  });

  test('gives 1 for a colour against itself', () => {
    expect(contrastRatio('#68E571', '#68E571')).toBeCloseTo(1, 5);
  });

  test('is symmetric', () => {
    expect(contrastRatio('#00B380', '#FFFFFF')).toBeCloseTo(
      contrastRatio('#FFFFFF', '#00B380'),
      5,
    );
  });

  // The three figures the Flutter app's colors.dart documents by hand. If our
  // maths disagrees with their measurements, one of us is wrong.
  test('reproduces the documented brand measurements', () => {
    expect(contrastRatio('#68E571', '#FFFFFF')).toBeCloseTo(1.61, 1);
    expect(contrastRatio('#00210A', '#68E571')).toBeCloseTo(10.67, 1);
    expect(contrastRatio('#68E571', '#000000')).toBeCloseTo(13.03, 1);
  });

  test('accepts shorthand and lowercase hex', () => {
    expect(contrastRatio('#fff', '#000')).toBeCloseTo(21, 2);
  });

  test('rejects a value that is not a hex colour', () => {
    expect(() => contrastRatio('rebeccapurple', '#FFFFFF')).toThrow();
  });
});
