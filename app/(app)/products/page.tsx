import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ProductsView } from '@/components/products/products-view';
import { currentUser } from '@/lib/server/current-user';

export const metadata: Metadata = { title: 'Products · Dinar' };

export default async function ProductsPage() {
  const user = await currentUser();
  return (
    // useSearchParams needs a Suspense boundary above it.
    <Suspense>
      <ProductsView isAdmin={user?.role === 'ADMIN'} />
    </Suspense>
  );
}
