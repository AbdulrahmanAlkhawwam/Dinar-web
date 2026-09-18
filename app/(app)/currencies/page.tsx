import type { Metadata } from 'next';

import { CurrenciesView } from '@/components/currencies/currencies-view';
import { currentUser } from '@/lib/server/current-user';

export const metadata: Metadata = { title: 'Currencies · Dinar' };

export default async function CurrenciesPage() {
  const user = await currentUser();
  return <CurrenciesView isAdmin={user?.role === 'ADMIN'} />;
}
