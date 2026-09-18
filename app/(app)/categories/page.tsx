import type { Metadata } from 'next';

import { CategoriesView } from '@/components/categories/categories-view';
import { currentUser } from '@/lib/server/current-user';

export const metadata: Metadata = { title: 'Categories · Dinar' };

export default async function CategoriesPage() {
  const user = await currentUser();
  return <CategoriesView isAdmin={user?.role === 'ADMIN'} />;
}
