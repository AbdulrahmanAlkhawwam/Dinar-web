'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Segmented } from '@/components/ui/segmented';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { useSaveOperation } from '@/lib/api/operations';
import { applyApiError } from '@/lib/client/form-errors';
import { calendarDate, toIsoDate } from '@/lib/dates';
import { formatAmount, formatUsd } from '@/lib/money';
import { pricePreview } from '@/lib/operations/pricing';
import type { Currency } from '@/lib/schemas/currency';
import { operationInputSchema, type OperationInput } from '@/lib/schemas/inputs';
import type { Operation, OperationType } from '@/lib/schemas/operation';

const TYPE_OPTIONS = [
  { value: 'EXPENSE', label: 'Expense' },
  { value: 'INCOME', label: 'Income' },
] as const;

export function OperationForm({
  operation,
  currencies,
  onDone,
}: {
  operation?: Operation;
  currencies: Currency[];
  onDone: () => void;
}) {
  const save = useSaveOperation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<OperationInput>({
    resolver: zodResolver(operationInputSchema),
    defaultValues: operation
      ? {
          title: operation.title,
          description: operation.description ?? '',
          amount: operation.amount,
          currencyId: operation.currencyId,
          type: operation.type,
          operationDate: calendarDate(operation.operationDate),
        }
      : {
          title: '',
          description: '',
          currencyId: currencies.length === 1 ? currencies[0].id : '',
          type: 'EXPENSE',
          operationDate: toIsoDate(new Date()),
        },
  });

  const [amount, currencyId] = useWatch({ control, name: ['amount', 'currencyId'] });
  const preview = pricePreview(
    { amount, currencyId },
    currencies,
    operation ? { currencyId: operation.currencyId, exchangeRate: operation.exchangeRate } : undefined,
  );
  const selected = currencies.find((c) => c.id === currencyId);

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      await save.mutateAsync({ id: operation?.id, input });
      onDone();
    } catch (error) {
      applyApiError(error, setError, setFormError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert>{formError}</Alert> : null}

      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <Segmented<OperationType>
            label="Type"
            value={field.value}
            options={TYPE_OPTIONS}
            onChange={field.onChange}
          />
        )}
      />

      <TextField
        label="Title"
        placeholder={operation ? undefined : 'Groceries'}
        error={errors.title?.message}
        {...register('title')}
      />

      <div className="grid grid-cols-[1fr_9rem] gap-4">
        <TextField
          label="Amount"
          type="number"
          step="any"
          min="0"
          inputMode="decimal"
          error={errors.amount?.message}
          {...register('amount', { valueAsNumber: true })}
        />
        <SelectField
          label="Currency"
          error={errors.currencyId?.message}
          {...register('currencyId')}
        >
          <option value="" disabled>
            Choose
          </option>
          {currencies.map((currency) => (
            <option key={currency.id} value={currency.id}>
              {currency.code}
            </option>
          ))}
        </SelectField>
      </div>

      {preview && selected ? (
        <div className="rounded-inner bg-surface-container px-4 py-3 text-xs text-on-surface-variant">
          {preview.amountInUSD !== null ? (
            <p>
              Recorded as{' '}
              <span className="font-medium text-on-surface">
                {formatUsd(preview.amountInUSD)}
              </span>{' '}
              at {formatAmount(preview.rate)} {selected.code} per dollar.
            </p>
          ) : (
            <p>
              Rate: {formatAmount(preview.rate)} {selected.code} per dollar.
            </p>
          )}
          {preview.reprices ? (
            <p className="mt-1 font-medium text-on-surface">
              Changing the currency replaces the rate this operation was
              recorded at with today’s rate.
            </p>
          ) : null}
        </div>
      ) : null}

      <TextField
        label="Date"
        type="date"
        error={errors.operationDate?.message}
        {...register('operationDate')}
      />

      <TextField
        label="Note (optional)"
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={save.isPending}>
          {operation ? 'Save changes' : 'Add operation'}
        </Button>
      </div>
    </form>
  );
}
