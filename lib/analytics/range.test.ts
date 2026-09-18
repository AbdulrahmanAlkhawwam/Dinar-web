import { describe, expect, test } from 'vitest';

import { presetRange } from './range';

// Thursday 18 September 2026, mid-afternoon local time.
const now = new Date(2026, 8, 18, 15, 30);

describe('presetRange', () => {
  test('a week runs Monday to Sunday', () => {
    expect(presetRange('week', now)).toEqual({
      from: '2026-09-14',
      to: '2026-09-20',
      unit: 'day',
    });
  });

  test('a month runs from the first to the last day', () => {
    expect(presetRange('month', now)).toEqual({
      from: '2026-09-01',
      to: '2026-09-30',
      unit: 'day',
    });
  });

  test('a year is bucketed by month', () => {
    expect(presetRange('year', now)).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
      unit: 'month',
    });
  });

  test('a Sunday belongs to the week that started the Monday before', () => {
    expect(presetRange('week', new Date(2026, 8, 20, 23, 0)).from).toBe('2026-09-14');
  });

  test('handles February in a leap year', () => {
    expect(presetRange('month', new Date(2028, 1, 10)).to).toBe('2028-02-29');
  });
});
