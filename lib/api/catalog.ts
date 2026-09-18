'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { z } from 'zod';

import { request } from '@/lib/client/request';
import { apiQuery, type ProductFilters } from '@/lib/products/filters';
import { categorySchema, productSchema } from '@/lib/schemas/catalog';
import type { CategoryInput, ProductInput } from '@/lib/schemas/catalog-inputs';
import { paginated } from '@/lib/schemas/pagination';

export const CATEGORY_FIELDS = ['name', 'image'] as const;
export const PRODUCT_FIELDS = [
  'title',
  'description',
  'price',
  'stock',
  'categoryId',
  'images',
] as const;

export const PRODUCT_PAGE_SIZE = 20;

const categoriesKey = ['categories'] as const;
const productsKey = ['products'] as const;
const productPage = paginated(productSchema);

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: () => request('/api/dinar/categories', { schema: z.array(categorySchema) }),
  });
}

export function useSaveCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) =>
      request(id ? `/api/dinar/categories/${id}` : '/api/dinar/categories', {
        method: id ? 'PATCH' : 'POST',
        // A new category with no image omits the field rather than sending
        // null; on an edit, null is how the image gets cleared.
        body: id || input.image ? input : { name: input.name },
        schema: categorySchema,
        fields: CATEGORY_FIELDS,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: categoriesKey });
      // Products embed their category, so a rename shows up there too.
      client.invalidateQueries({ queryKey: productsKey });
    },
  });
}

export function useDeleteCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/api/dinar/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: categoriesKey }),
  });
}

export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: [...productsKey, filters],
    queryFn: () =>
      request(`/api/dinar/products${apiQuery(filters, PRODUCT_PAGE_SIZE)}`, {
        schema: productPage,
      }),
    placeholderData: keepPreviousData,
  });
}

export function useSaveProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ProductInput }) =>
      request(id ? `/api/dinar/products/${id}` : '/api/dinar/products', {
        method: id ? 'PATCH' : 'POST',
        body: input,
        schema: productSchema,
        fields: PRODUCT_FIELDS,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: productsKey }),
  });
}

export function useDeleteProduct() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/api/dinar/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: productsKey }),
  });
}
