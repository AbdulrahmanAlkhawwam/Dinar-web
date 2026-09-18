'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * The native <dialog> in modal mode: focus trapping, Escape to close, and an
 * inert page behind it come from the browser rather than from code here.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // A click on the backdrop lands on the <dialog> element itself.
        if (event.target === event.currentTarget) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-card bg-surface-container-low p-0 text-on-surface ring-1 ring-outline-variant backdrop:bg-black/50"
    >
      {open ? (
        <div className="p-6">
          <h2 id={titleId} className="mb-5 text-lg font-bold">
            {title}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
