import type { ButtonHTMLAttributes } from 'react';

type Variant = 'filled' | 'tonal' | 'text' | 'danger';

const variants: Record<Variant, string> = {
  // Primary on white is 1.61:1 — almost no edge — so the filled button carries
  // a shadow in light mode, as the Flutter app's filled controls do. On black
  // the green stands on its own.
  filled:
    'bg-primary text-on-primary shadow-md shadow-black/15 hover:brightness-95 dark:shadow-none',
  tonal:
    'bg-secondary-container text-on-secondary-container hover:brightness-95',
  text: 'bg-transparent text-on-surface hover:bg-surface-container',
  danger: 'bg-error text-on-error hover:brightness-95',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export function Button({
  variant = 'filled',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-pill px-6 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      ) : null}
      {children}
    </button>
  );
}
