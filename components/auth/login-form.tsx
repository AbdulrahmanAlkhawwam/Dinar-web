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
import { loginInputSchema, type LoginInput } from '@/lib/schemas/auth';

const FIELDS = ['email', 'password'] as const;

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginInputSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await request('/api/auth/login', {
        method: 'POST',
        body: values,
        fields: FIELDS,
      });
      router.replace(next);
      router.refresh();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError('Could not reach the server. Check your connection.');
        return;
      }
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        setError(field as keyof LoginInput, { message });
      }
      if (Object.keys(error.fieldErrors).length === 0) {
        setFormError(error.message);
      }
    }
  });

  return (
    <Card>
      <h1 className="mb-1 text-xl font-bold">Sign in</h1>
      <p className="mb-6 text-sm text-on-surface-variant">
        Welcome back. Let&apos;s manage your money.
      </p>

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {formError ? <Alert>{formError}</Alert> : null}
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" loading={isSubmitting} className="mt-2">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-on-surface-variant">
        New to Dinar?{' '}
        <Link href="/register" className="font-medium text-on-surface underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
