'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Segmented } from '@/components/ui/segmented';
import { Table, Td, Th } from '@/components/ui/table';
import { TextField } from '@/components/ui/text-field';
import { useCurrencies } from '@/lib/api/currencies';
import { useDeleteOperation, useOperations } from '@/lib/api/operations';
import { calendarDate } from '@/lib/dates';
import { formatMoney, formatUsd } from '@/lib/money';
import {
  parseFilters,
  toSearchParams,
  type OperationFilters,
} from '@/lib/operations/filters';
import type { Operation, OperationType } from '@/lib/schemas/operation';

import { OperationForm } from './operation-form';

type TypeFilter = OperationType | 'ALL';

const TYPE_FILTERS = [
  { value: 'ALL', label: 'All' },
  { value: 'INCOME', label: 'Income' },
  { value: 'EXPENSE', label: 'Expense' },
] as const;

type Editing = { mode: 'create' } | { mode: 'edit'; operation: Operation } | null;

function formatDate(timestamp: string) {
  // Built from the calendar date so the UTC-midnight timestamp isn't shifted.
  const [y, m, d] = calendarDate(timestamp).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function OperationsView() {
  const router = useRouter();
  const pathname = usePathname();
  const filters = parseFilters(new URLSearchParams(useSearchParams().toString()));

  const operations = useOperations(filters);
  const currencies = useCurrencies();
  const remove = useDeleteOperation();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Operation | null>(null);

  const setFilters = (next: OperationFilters) => {
    const query = toSearchParams(next).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  // Any change other than turning the page starts again from page 1.
  const refine = (change: Partial<OperationFilters>) =>
    setFilters({ ...filters, ...change, page: 1 });

  const hasFilters = Boolean(filters.type || filters.from || filters.to);
  const noCurrencies = currencies.isSuccess && currencies.data.length === 0;

  const closeDelete = () => {
    setDeleting(null);
    remove.reset();
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Operations</h1>
          <p className="text-sm text-on-surface-variant">Your income and expenses.</p>
        </div>
        <Button
          onClick={() => setEditing({ mode: 'create' })}
          disabled={!currencies.isSuccess || noCurrencies}
        >
          Add operation
        </Button>
      </div>

      {noCurrencies ? (
        <Alert>
          There are no currencies yet, and every operation needs one. An
          administrator can add them on the{' '}
          <Link href="/currencies" className="underline">
            Currencies
          </Link>{' '}
          page.
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-4">
        <Segmented<TypeFilter>
          label="Type"
          value={filters.type ?? 'ALL'}
          options={TYPE_FILTERS}
          onChange={(value) => refine({ type: value === 'ALL' ? undefined : value })}
        />
        <TextField
          label="From"
          type="date"
          value={filters.from ?? ''}
          max={filters.to}
          onChange={(event) => refine({ from: event.target.value || undefined })}
        />
        <TextField
          label="To"
          type="date"
          value={filters.to ?? ''}
          min={filters.from}
          onChange={(event) => refine({ to: event.target.value || undefined })}
        />
        {hasFilters ? (
          <Button variant="text" onClick={() => setFilters({ page: 1 })}>
            Clear filters
          </Button>
        ) : null}
      </div>

      {operations.isPending ? (
        <p className="text-sm text-on-surface-variant">Loading operations…</p>
      ) : operations.isError ? (
        <Alert>{operations.error.message}</Alert>
      ) : operations.data.data.length === 0 ? (
        <EmptyState title={hasFilters ? 'Nothing matches these filters' : 'No operations yet'}>
          {hasFilters
            ? 'Try a wider date range, or clear the filters.'
            : 'Record your first income or expense to start tracking.'}
        </EmptyState>
      ) : (
        <div
          className={`flex flex-col gap-4 transition-opacity ${operations.isPlaceholderData ? 'opacity-60' : ''}`}
        >
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Title</Th>
                <Th className="text-right">Amount</Th>
                <Th className="text-right">In USD</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {operations.data.data.map((operation) => {
                const income = operation.type === 'INCOME';
                return (
                  <tr key={operation.id}>
                    <Td className="whitespace-nowrap text-on-surface-variant">
                      {formatDate(operation.operationDate)}
                    </Td>
                    <Td>
                      <p className="font-medium">{operation.title}</p>
                      {operation.description ? (
                        <p className="text-xs text-on-surface-variant">{operation.description}</p>
                      ) : null}
                    </Td>
                    <Td
                      className={`whitespace-nowrap text-right font-medium tabular-nums ${income ? 'text-income' : 'text-expense'}`}
                    >
                      <span className="sr-only">{income ? 'Income' : 'Expense'}: </span>
                      {income ? '+' : '−'}
                      {formatMoney(operation.amount, operation.currency.symbol)}
                    </Td>
                    <Td className="whitespace-nowrap text-right tabular-nums text-on-surface-variant">
                      {formatUsd(operation.amountInUSD)}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="text"
                          onClick={() => setEditing({ mode: 'edit', operation })}
                          disabled={!currencies.isSuccess}
                          aria-label={`Edit ${operation.title}`}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => setDeleting(operation)}
                          aria-label={`Delete ${operation.title}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Pagination
            page={operations.data.meta.page}
            totalPages={operations.data.meta.totalPages}
            total={operations.data.meta.total}
            onPage={(page) => setFilters({ ...filters, page })}
          />
        </div>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? 'Edit operation' : 'Add operation'}
      >
        {editing && currencies.isSuccess ? (
          <OperationForm
            key={editing.mode === 'edit' ? editing.operation.id : 'new'}
            operation={editing.mode === 'edit' ? editing.operation : undefined}
            currencies={currencies.data}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this operation?"
        confirmLabel="Delete"
        pending={remove.isPending}
        error={remove.isError ? remove.error.message : null}
        onClose={closeDelete}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
      >
        “{deleting?.title}” will be removed from your ledger and your totals.
        This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
