import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';

/** Scrolls sideways inside its own box so the page never does. */
export function Table({ className = '', ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-card bg-surface-container-low">
      <table {...props} className={`w-full border-collapse text-sm ${className}`} />
    </div>
  );
}

export function Th({ className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      {...props}
      className={`whitespace-nowrap border-b border-outline-variant px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-on-surface-variant ${className}`}
    />
  );
}

export function Td({ className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className={`border-b border-outline-variant px-4 py-3 align-middle last:border-b-0 ${className}`}
    />
  );
}
