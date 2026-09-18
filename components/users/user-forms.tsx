'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { SelectField, type SelectFieldProps } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { useCreateUser, useUpdateUser } from '@/lib/api/users';
import { ApiError } from '@/lib/client/api-error';
import { applyApiError } from '@/lib/client/form-errors';
import type { User } from '@/lib/schemas/user';
import {
  newUserInputSchema,
  userEditInputSchema,
  type NewUserInput,
  type UserEditFormValues,
  type UserEditInput,
} from '@/lib/schemas/user-inputs';

function RoleSelect({ hint, ...props }: Omit<SelectFieldProps, 'label' | 'children'> & { hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <SelectField {...props} label="Role">
        <option value="USER">Member</option>
        <option value="ADMIN">Administrator</option>
      </SelectField>
      {hint ? <p className="px-5 text-[11px] text-on-surface-variant">{hint}</p> : null}
    </div>
  );
}

export function NewUserForm({ onDone }: { onDone: () => void }) {
  const create = useCreateUser();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewUserInput>({
    resolver: zodResolver(newUserInputSchema),
    defaultValues: { name: '', email: '', password: '', role: 'USER' },
  });

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      await create.mutateAsync(input);
      onDone();
    } catch (error) {
      // AuthService.register's 409 is about the email, so it goes there.
      if (error instanceof ApiError && error.status === 409) {
        setError('email', { message: error.message });
        return;
      }
      applyApiError(error, setError, setFormError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert>{formError}</Alert> : null}
      <TextField label="Name" autoComplete="off" error={errors.name?.message} {...register('name')} />
      <TextField label="Email" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters. Share it with the person securely."
        error={errors.password?.message}
        {...register('password')}
      />
      <RoleSelect error={errors.role?.message} {...register('role')} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending}>
          Add user
        </Button>
      </div>
    </form>
  );
}

export function EditUserForm({
  user,
  isSelf,
  onDone,
}: {
  user: User;
  isSelf: boolean;
  onDone: () => void;
}) {
  const update = useUpdateUser();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserEditFormValues, unknown, UserEditInput>({
    resolver: zodResolver(userEditInputSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      avatar: user.avatar ?? '',
      role: user.role,
    },
  });

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null);
    try {
      await update.mutateAsync({ id: user.id, input });
      onDone();
    } catch (error) {
      applyApiError(error, setError, setFormError);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {formError ? <Alert>{formError}</Alert> : null}
      <TextField label="Name" error={errors.name?.message} {...register('name')} />
      <TextField label="Email" type="email" error={errors.email?.message} {...register('email')} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Phone (optional)" type="tel" error={errors.phone?.message} {...register('phone')} />
        <TextField
          label="Avatar URL (optional)"
          type="url"
          placeholder="https://"
          error={errors.avatar?.message}
          {...register('avatar')}
        />
      </div>
      <RoleSelect
        disabled={isSelf}
        hint={isSelf ? 'You cannot change your own role.' : undefined}
        error={errors.role?.message}
        {...register('role')}
      />
      <p className="rounded-inner bg-surface-container px-4 py-3 text-xs text-on-surface-variant">
        Passwords cannot be changed here. The API saves a password set this
        way without hashing it, which would stop this person signing in.
      </p>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="text" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={update.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
