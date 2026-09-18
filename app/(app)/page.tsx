import { cookies } from 'next/headers';

import { Card } from '@/components/ui/card';
import { USER_COOKIE } from '@/lib/server/cookies';
import { parseSessionUser } from '@/lib/server/session';

function greeting(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default async function OverviewPage() {
  const user = parseSessionUser((await cookies()).get(USER_COOKIE)?.value);
  const now = new Date();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div>
        <p className="text-sm text-on-surface-variant">
          {greeting(now.getHours())}, {user?.name.split(' ')[0]}. Today is
        </p>
        <h1 className="text-3xl font-bold">
          {now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h1>
      </div>

      <Card>
        <h2 className="mb-2 text-lg font-bold">Your ledger</h2>
        <p className="text-sm text-on-surface-variant">
          Income, expense and balance summaries arrive with the operations
          screen in the next phase.
        </p>
      </Card>
    </div>
  );
}
