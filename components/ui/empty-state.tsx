import type { ReactNode } from 'react';

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-outline-variant px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      {children ? (
        <div className="max-w-md text-sm text-on-surface-variant">{children}</div>
      ) : null}
      {action}
    </div>
  );
}
