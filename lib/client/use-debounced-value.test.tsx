import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { useDebouncedValue } from './use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('holds the old value until typing pauses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'p' },
    });

    rerender({ value: 'ph' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'pho' });
    act(() => vi.advanceTimersByTime(200));

    // 400ms since the first change, but only 200ms since the last one.
    expect(result.current).toBe('p');

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('pho');
  });
});
