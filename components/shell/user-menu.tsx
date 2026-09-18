'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { request } from '@/lib/client/request';

import { ThemeToggle } from './theme-toggle';

export function UserMenu({ name, role }: { name: string; role: string }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      router.replace('/login');
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeToggle />
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium leading-tight">{name}</p>
        <p className="text-[11px] text-on-surface-variant">
          {role === 'ADMIN' ? 'Administrator' : 'Member'}
        </p>
      </div>
      <Button variant="text" onClick={signOut} loading={signingOut}>
        Sign out
      </Button>
    </div>
  );
}
