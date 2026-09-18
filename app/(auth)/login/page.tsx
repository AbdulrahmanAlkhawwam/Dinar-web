import type { Metadata } from 'next';

import { LoginForm } from '@/components/auth/login-form';
import { safeNext } from '@/lib/safe-next';

export const metadata: Metadata = { title: 'Sign in · Dinar' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next } = await searchParams;
  return <LoginForm next={safeNext(next)} />;
}
