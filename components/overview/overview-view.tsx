'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Segmented } from '@/components/ui/segmented';
import { Table, Td, Th } from '@/components/ui/table';
import { useOperationsInRange } from '@/lib/api/operations';
import { summarize } from '@/lib/analytics/aggregate';
import { presetRange, type RangePreset } from '@/lib/analytics/range';
import { bucketize } from '@/lib/analytics/series';
import { formatMoney, formatUsd } from '@/lib/money';

import { CashFlowChart, bucketTitle } from './cash-flow-chart';

const PRESETS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
] as const;

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${tone ?? ''}`}>{value}</p>
    </Card>
  );
}

export function OverviewView() {
  const [preset, setPreset] = useState<RangePreset>('month');
  const [showTable, setShowTable] = useState(false);
  const range = presetRange(preset);
  const query = useOperationsInRange(range);

  const rows = query.data?.rows ?? [];
  const summary = summarize(rows);
  const buckets = bucketize(rows, range);
  const largest = rows
    .filter((op) => op.type === 'EXPENSE')
    .sort((a, b) => b.amountInUSD - a.amountInUSD)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold">Cash flow</h2>
        <Segmented<RangePreset> label="Period" value={preset} options={PRESETS} onChange={setPreset} />
      </div>

      {query.isError ? <Alert>{query.error.message}</Alert> : null}
      {query.data?.truncated ? (
        <Alert>
          This period has more operations than the dashboard can total in the
          browser, so these figures are incomplete.
        </Alert>
      ) : null}

      <div className={`grid gap-4 sm:grid-cols-3 ${query.isFetching ? 'opacity-60' : ''}`}>
        <Stat label="Income" value={formatUsd(summary.income)} tone="text-income" />
        <Stat label="Expense" value={formatUsd(summary.expense)} tone="text-expense" />
        <Stat
          label="Net"
          value={formatUsd(summary.net)}
          tone={summary.net < 0 ? 'text-expense' : undefined}
        />
      </div>
      <p className="-mt-3 text-xs text-on-surface-variant">
        Totals are in US dollars, using each operation’s rate when it was
        recorded. {query.isSuccess ? `${summary.count} operations.` : null}
      </p>

      {query.isPending ? (
        <Card>
          <p className="text-sm text-on-surface-variant">Loading…</p>
        </Card>
      ) : query.isSuccess && rows.length === 0 ? (
        <EmptyState
          title="Nothing recorded in this period"
          action={
            <Link href="/operations" className="text-sm font-medium underline">
              Go to operations
            </Link>
          }
        />
      ) : query.isSuccess ? (
        <>
          <Card className="flex flex-col gap-4">
            <CashFlowChart buckets={buckets} range={range} />
            <div>
              <Button variant="text" onClick={() => setShowTable((v) => !v)} aria-expanded={showTable}>
                {showTable ? 'Hide data table' : 'Show data table'}
              </Button>
            </div>
            {showTable ? (
              <Table>
                <thead>
                  <tr>
                    <Th>Period</Th>
                    <Th className="text-right">Income</Th>
                    <Th className="text-right">Expense</Th>
                    <Th className="text-right">Net</Th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((b) => (
                    <tr key={b.key}>
                      <Td>{bucketTitle(b.key, range)}</Td>
                      <Td className="text-right tabular-nums">{formatUsd(b.income)}</Td>
                      <Td className="text-right tabular-nums">{formatUsd(b.expense)}</Td>
                      <Td className="text-right tabular-nums">{formatUsd(b.income - b.expense)}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : null}
          </Card>

          {largest.length > 0 ? (
            <Card>
              <h3 className="mb-3 font-bold">Largest expenses</h3>
              <ol className="flex flex-col divide-y divide-outline-variant">
                {largest.map((op) => (
                  <li key={op.id} className="flex items-baseline justify-between gap-4 py-2 text-sm">
                    <span className="truncate">{op.title}</span>
                    <span className="shrink-0 text-right tabular-nums">
                      <span className="font-medium">{formatUsd(op.amountInUSD)}</span>{' '}
                      <span className="text-xs text-on-surface-variant">
                        {formatMoney(op.amount, op.currency.symbol)}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
