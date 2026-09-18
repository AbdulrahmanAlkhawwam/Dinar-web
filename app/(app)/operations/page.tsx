import type { Metadata } from 'next';
import { Suspense } from 'react';

import { OperationsView } from '@/components/operations/operations-view';

export const metadata: Metadata = { title: 'Operations · Dinar' };

export default function OperationsPage() {
  return (
    // useSearchParams needs a Suspense boundary above it.
    <Suspense>
      <OperationsView />
    </Suspense>
  );
}
