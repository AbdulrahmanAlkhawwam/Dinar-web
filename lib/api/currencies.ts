'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { request } from '@/lib/client/request';
import { currencySchema } from '@/lib/schemas/currency';
import type { CurrencyInput } from '@/lib/schemas/inputs';

export const CURRENCY_FIELDS = ['code', 'name', 'symbol', 'exchangeRateFromUSD'] as const;

const currenciesKey = ['currencies'] as const;

export function useCurrencies() {
  return useQuery({
    queryKey: currenciesKey,
    queryFn: () =>
      request('/api/dinar/currencies', { schema: z.array(currencySchema) }),
  });
}

export function useSaveCurrency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CurrencyInput }) =>
      request(id ? `/api/dinar/currencies/${id}` : '/api/dinar/currencies', {
        method: id ? 'PATCH' : 'POST',
        body: input,
        schema: currencySchema,
        fields: CURRENCY_FIELDS,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: currenciesKey }),
  });
}

export function useDeleteCurrency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request(`/api/dinar/currencies/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: currenciesKey }),
  });
}
