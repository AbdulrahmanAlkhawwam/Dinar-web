'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { fetchAllPages } from '@/lib/analytics/series';
import type { DateRange } from '@/lib/analytics/range';
import { request } from '@/lib/client/request';
import { apiQuery, type OperationFilters } from '@/lib/operations/filters';
import type { OperationInput } from '@/lib/schemas/inputs';
import { operationSchema, paginated } from '@/lib/schemas/operation';

export const OPERATION_FIELDS = [
  'title',
  'description',
  'amount',
  'currencyId',
  'type',
  'operationDate',
] as const;

export const PAGE_SIZE = 20;
/** QueryOperationsDto: @Max(100). */
const MAX_PAGE_SIZE = 100;

const operationPage = paginated(operationSchema);
const operationsKey = ['operations'] as const;

export function useOperations(filters: OperationFilters) {
  return useQuery({
    queryKey: [...operationsKey, 'page', filters],
    queryFn: () =>
      request(`/api/dinar/operations${apiQuery(filters, PAGE_SIZE)}`, {
        schema: operationPage,
      }),
    // Keep the old page on screen while the next one loads, instead of
    // collapsing the table to a spinner on every page turn.
    placeholderData: keepPreviousData,
  });
}

/** Every operation in a range, for summaries. See fetchAllPages for the cap. */
export function useOperationsInRange(range: DateRange) {
  return useQuery({
    queryKey: [...operationsKey, 'range', range.from, range.to],
    queryFn: () =>
      fetchAllPages((page) =>
        request(
          `/api/dinar/operations${apiQuery({ page, from: range.from, to: range.to }, MAX_PAGE_SIZE)}`,
          { schema: operationPage },
        ),
      ),
  });
}

export function useSaveOperation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: OperationInput }) =>
      request(id ? `/api/dinar/operations/${id}` : '/api/dinar/operations', {
        method: id ? 'PATCH' : 'POST',
        // A new operation with no note should store null, not "". On an edit
        // the empty string is how an existing note gets cleared.
        body: id ? input : { ...input, description: input.description || undefined },
        schema: operationSchema,
        fields: OPERATION_FIELDS,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: operationsKey }),
  });
}

export function useDeleteOperation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      request(`/api/dinar/operations/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: operationsKey }),
  });
}
