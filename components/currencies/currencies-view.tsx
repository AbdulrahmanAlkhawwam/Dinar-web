'use client';

import { useState } from 'react';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td, Th } from '@/components/ui/table';
import { useCurrencies, useDeleteCurrency } from '@/lib/api/currencies';
import { ApiError } from '@/lib/client/api-error';
import { formatAmount } from '@/lib/money';
import type { Currency } from '@/lib/schemas/currency';

import { CurrencyForm } from './currency-form';

type Editing = { mode: 'create' } | { mode: 'edit'; currency: Currency } | null;

function deleteErrorMessage(error: unknown): string {
  // Operation.currency is `onDelete: Restrict`, and CurrenciesService.remove
  // doesn't catch the foreign-key error, so a currency in use comes back as
  // a bare 500.
  if (error instanceof ApiError && error.status >= 500) {
    return 'This currency could not be deleted. It is most likely still used by operations, which the database will not allow.';
  }
  return error instanceof Error ? error.message : 'Could not delete this currency.';
}

export function CurrenciesView({ isAdmin }: { isAdmin: boolean }) {
  const currencies = useCurrencies();
  const remove = useDeleteCurrency();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Currency | null>(null);

  const closeDelete = () => {
    setDeleting(null);
    remove.reset();
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Currencies</h1>
          <p className="text-sm text-on-surface-variant">
            Rates are how much of each currency one US dollar buys.
          </p>
        </div>
        {isAdmin ? (
          <Button onClick={() => setEditing({ mode: 'create' })}>Add currency</Button>
        ) : null}
      </div>

      {currencies.isPending ? (
        <p className="text-sm text-on-surface-variant">Loading currencies…</p>
      ) : currencies.isError ? (
        <Alert>{currencies.error.message}</Alert>
      ) : currencies.data.length === 0 ? (
        <EmptyState
          title="No currencies yet"
          action={
            isAdmin ? (
              <Button onClick={() => setEditing({ mode: 'create' })}>
                Add the first currency
              </Button>
            ) : null
          }
        >
          {isAdmin
            ? 'Operations need a currency. Start with USD at a rate of 1.'
            : 'Operations need a currency, and only an administrator can add one.'}
        </EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Symbol</Th>
              <Th className="text-right">Per 1 USD</Th>
              {isAdmin ? <Th className="text-right">Actions</Th> : null}
            </tr>
          </thead>
          <tbody>
            {currencies.data.map((currency) => (
              <tr key={currency.id}>
                <Td className="font-medium">{currency.code}</Td>
                <Td>{currency.name}</Td>
                <Td>{currency.symbol}</Td>
                <Td className="text-right tabular-nums">
                  {formatAmount(currency.exchangeRateFromUSD)}
                </Td>
                {isAdmin ? (
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="text"
                        onClick={() => setEditing({ mode: 'edit', currency })}
                        aria-label={`Edit ${currency.code}`}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="text"
                        onClick={() => setDeleting(currency)}
                        aria-label={`Delete ${currency.code}`}
                      >
                        Delete
                      </Button>
                    </div>
                  </Td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <Dialog
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.mode === 'edit' ? `Edit ${editing.currency.code}` : 'Add currency'}
      >
        {editing ? (
          <CurrencyForm
            key={editing.mode === 'edit' ? editing.currency.id : 'new'}
            currency={editing.mode === 'edit' ? editing.currency : undefined}
            onDone={() => setEditing(null)}
          />
        ) : null}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.code ?? ''}?`}
        confirmLabel="Delete"
        pending={remove.isPending}
        error={remove.isError ? deleteErrorMessage(remove.error) : null}
        onClose={closeDelete}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
      >
        {deleting?.name} will no longer be available for new operations. This
        cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
