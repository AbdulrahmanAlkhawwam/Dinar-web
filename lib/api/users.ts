'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { request } from '@/lib/client/request';
import { userSchema } from '@/lib/schemas/user';
import type { NewUserInput, UserEditInput } from '@/lib/schemas/user-inputs';

export const NEW_USER_FIELDS = ['name', 'email', 'password', 'role'] as const;
export const USER_EDIT_FIELDS = ['name', 'email', 'phone', 'avatar', 'role'] as const;

const usersKey = ['users'] as const;

export function useUsers() {
  return useQuery({
    queryKey: usersKey,
    queryFn: () => request('/api/dinar/users', { schema: z.array(userSchema) }),
  });
}

/** Goes through /api/admin/users, which registers the account properly. */
export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: NewUserInput) =>
      request('/api/admin/users', { method: 'POST', body: input, fields: NEW_USER_FIELDS }),
    // Invalidate on failure too: a failed promotion still created the account.
    onSettled: () => client.invalidateQueries({ queryKey: usersKey }),
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UserEditInput }) =>
      request(`/api/dinar/users/${id}`, {
        method: 'PATCH',
        body: input,
        schema: userSchema,
        fields: USER_EDIT_FIELDS,
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: usersKey }),
  });
}

export function useDeleteUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => request(`/api/dinar/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: usersKey }),
  });
}
