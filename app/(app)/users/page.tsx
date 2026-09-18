import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { UsersView } from '@/components/users/users-view';
import { currentUser } from '@/lib/server/current-user';
import { DINAR_API_URL } from '@/lib/server/session';

export const metadata: Metadata = { title: 'Users · Dinar' };

/**
 * Asks the API for the user list with no credentials at all. While that
 * works, the /users routes are unguarded and the page says so; once the
 * backend adds its guards this starts returning 401 and the notice goes.
 */
async function userEndpointsAreOpen(): Promise<boolean> {
  try {
    // HEAD, and never cached: the answer is all that is needed, and a cached
    // GET would keep every user's details in Next's data cache on disk.
    const response = await fetch(`${DINAR_API_URL}/users`, {
      method: 'HEAD',
      cache: 'no-store',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export default async function UsersPage() {
  const user = await currentUser();
  // proxy.ts already keeps members out; this covers a stale role cookie.
  if (user?.role !== 'ADMIN') {
    redirect('/');
  }

  return <UsersView currentUserId={user.id} endpointsOpen={await userEndpointsAreOpen()} />;
}
