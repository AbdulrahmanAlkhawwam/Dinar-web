'use client';

import type { ReactNode } from 'react';

import { Alert } from './alert';
import { Button } from './button';
import { Dialog } from './dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pending: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <div className="text-sm text-on-surface-variant">{children}</div>
        {error ? <Alert>{error}</Alert> : null}
        <div className="flex justify-end gap-2">
          <Button variant="text" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={pending}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
