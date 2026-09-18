import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Sidebar } from '@/components/shell/sidebar';
import { UserMenu } from '@/components/shell/user-menu';
import { USER_COOKIE } from '@/lib/server/cookies';
import { parseSessionUser } from '@/lib/server/session';

export default async function AppLayout({ children }: LayoutProps<'/'>) {
  const user = parseSessionUser((await cookies()).get(USER_COOKIE)?.value);
  // proxy.ts already sends signed-out visitors to /login; this covers a
  // refresh cookie whose companion user cookie was lost or tampered with.
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar isAdmin={user.role === 'ADMIN'} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-end border-b border-outline-variant px-4 md:px-8">
          <UserMenu name={user.name} role={user.role} />
        </header>
        <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
