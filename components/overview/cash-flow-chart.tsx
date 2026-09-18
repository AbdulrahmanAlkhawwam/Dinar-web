'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { Bucket } from '@/lib/analytics/series';
import type { DateRange } from '@/lib/analytics/range';
import { formatUsd } from '@/lib/money';

interface Point {
  key: string;
  income: number;
  /** Negative, so it draws below the baseline. */
  expense: number;
}

const compact = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Bucket keys are calendar dates; format them in UTC so they don't shift. */
function bucketDate(key: string) {
  return new Date(key.length === 7 ? `${key}-01T00:00:00Z` : `${key}T00:00:00Z`);
}

export function tickLabel(key: string, range: DateRange) {
  const date = bucketDate(key);
  if (range.unit === 'month') {
    return date.toLocaleDateString('en-GB', { month: 'short', timeZone: 'UTC' });
  }
  const days = (Date.parse(range.to) - Date.parse(range.from)) / 86_400_000 + 1;
  return days <= 7
    ? date.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
    : String(date.getUTCDate());
}

export function bucketTitle(key: string, range: DateRange) {
  return bucketDate(key).toLocaleDateString(
    'en-GB',
    range.unit === 'month'
      ? { month: 'long', year: 'numeric', timeZone: 'UTC' }
      : { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' },
  );
}

function Swatch({ color }: { color: string }) {
  return <span aria-hidden className="inline-block size-2.5 rounded-sm" style={{ background: color }} />;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
  range: DateRange;
}

function ChartTooltip({ active, payload, range }: ChartTooltipProps) {
  const point = payload?.[0]?.payload as Point | undefined;
  if (!active || !point) {
    return null;
  }
  const expense = -point.expense;
  return (
    <div className="rounded-inner bg-surface-container-high px-4 py-3 text-xs text-on-surface shadow-lg">
      <p className="mb-2 font-medium">{bucketTitle(point.key, range)}</p>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 tabular-nums">
        <dt className="flex items-center gap-2 text-on-surface-variant">
          <Swatch color="var(--color-chart-income)" /> Income
        </dt>
        <dd className="text-right">{formatUsd(point.income)}</dd>
        <dt className="flex items-center gap-2 text-on-surface-variant">
          <Swatch color="var(--color-chart-expense)" /> Expense
        </dt>
        <dd className="text-right">{formatUsd(expense)}</dd>
        <dt className="text-on-surface-variant">Net</dt>
        <dd className="text-right font-medium">{formatUsd(point.income - expense)}</dd>
      </dl>
    </div>
  );
}

/**
 * Income above the baseline, expense below it. Position carries which is
 * which, so the red/green pair is reinforcement rather than the only cue.
 */
export function CashFlowChart({ buckets, range }: { buckets: Bucket[]; range: DateRange }) {
  const data: Point[] = buckets.map((b) => ({
    key: b.key,
    income: b.income,
    expense: -b.expense,
  }));

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-on-surface-variant">
        <li className="flex items-center gap-2">
          <Swatch color="var(--color-chart-income)" /> Income, above the line
        </li>
        <li className="flex items-center gap-2">
          <Swatch color="var(--color-chart-expense)" /> Expense, below the line
        </li>
      </ul>
      <div className="h-72" role="img" aria-label="Income and expense by period. A data table follows.">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} stackOffset="sign" margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-outline-variant)" strokeWidth={1} />
            <XAxis
              dataKey="key"
              tickFormatter={(key: string) => tickLabel(key, range)}
              tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={8}
            />
            <YAxis
              // Expense is plotted negative; the axis shows magnitudes.
              tickFormatter={(value: number) => `$${compact.format(Math.abs(value))}`}
              tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <ReferenceLine y={0} stroke="var(--color-outline)" strokeWidth={1} />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-container)' }}
              content={({ active, payload }) => (
                <ChartTooltip active={active} payload={payload} range={range} />
              )}
            />
            <Bar
              dataKey="income"
              stackId="flow"
              fill="var(--color-chart-income)"
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Bar
              dataKey="expense"
              stackId="flow"
              fill="var(--color-chart-expense)"
              maxBarSize={24}
              // The data end of a below-baseline bar is its bottom.
              radius={[0, 0, 4, 4]}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
