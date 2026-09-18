'use client';

import { Button } from './button';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPage: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPage }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-4">
      <p className="text-sm text-on-surface-variant">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button variant="tonal" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="tonal" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}
