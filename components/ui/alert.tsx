import type { ReactNode } from 'react';

export function Alert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-inner bg-error-container px-4 py-3 text-sm text-on-error-container"
    >
      {children}
    </div>
  );
}
