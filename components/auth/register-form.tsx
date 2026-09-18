'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { ApiError } from '@/lib/client/api-error';
import { request } from '@/lib/client/request';
import { registerInputSchema, type RegisterInput } from '@/lib/schemas/auth';

const FIELDS = ['name', 'email', 'password'] as const;

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerInputSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await request('/api/auth/register', {
        method: 'POST',
        body: values,
        fields: FIELDS,
      });
      router.replace('/');
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError('Could not reach the server. Check your connection.');
        return;
      }
      if (error.status === 409) {
        setError('email', { message: 'An account with this email already exists' });
        return;
      }
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        setError(field as keyof RegisterInput, { message });
      }
      if (Object.keys(error.fieldErrors).length === 0) {
        setFormError(error.message);
      }
    }
  });

  return (
    <Card>
      <h1 className="mb-1 text-xl font-bold">Create your account</h1>
      <p className="mb-6 text-sm text-on-surface-variant">
        Yes, you are in the right place.
      </p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError ? <Alert>{formError}</Alert> : null}
        <TextField
          label="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-on-surface underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
