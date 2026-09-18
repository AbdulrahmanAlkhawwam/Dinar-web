'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useSaveCurrency } from '@/lib/api/currencies';
import { applyApiError } from '@/lib/client/form-errors';
import type { Currency } from '@/lib/schemas/currency';
import { currencyInputSchema, type CurrencyInput } from '@/lib/schemas/inputs';

export function CurrencyForm({
  currency,
  onDone,
}: {
  currency?: Currency;
  onDone: () => void;
}) {
  const save = useSaveCurrency();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CurrencyInput>({
    resolver: zodResolver(currencyInputSchema),
    defaultValues: currency
      ? {
          code: currency.code,
          name: currency.name,
          symbol: currency.symbol,
          exchangeRateFromUSD: currency.exchangeRateFromUSD,
        }
      : undefined,
  });

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      await save.mutateAsync({ id: currency?.id, input });
      onDone();
    } catch (error) {
      applyApiError(error, setError, setFormError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert>{formError}</Alert> : null}
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Code"
          placeholder="USD"
          maxLength={3}
          autoCapitalize="characters"
          error={errors.code?.message}
          {...register('code')}
        />
        <TextField
          label="Symbol"
          placeholder="$"
          error={errors.symbol?.message}
          {...register('symbol')}
        />
      </div>
      <TextField
        label="Name"
        placeholder="US Dollar"
        error={errors.name?.message}
        {...register('name')}
      />
      <TextField
        label="Rate — units per 1 USD"
        type="number"
        step="any"
        min="0"
        inputMode="decimal"
        hint="How much of this currency one US dollar buys. USD itself is 1."
        error={errors.exchangeRateFromUSD?.message}
        {...register('exchangeRateFromUSD', { valueAsNumber: true })}
      />
      {currency ? (
        <p className="rounded-inner bg-surface-container px-4 py-3 text-xs text-on-surface-variant">
          Changing the rate affects new operations only. Existing operations
          keep the rate they were recorded at.
        </p>
      ) : null}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {currency ? 'Save changes' : 'Add currency'}
        </Button>
      </div>
    </form>
  );
}
