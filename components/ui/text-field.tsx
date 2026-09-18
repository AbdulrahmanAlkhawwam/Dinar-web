import { useId, type InputHTMLAttributes, type Ref } from 'react';

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  ref?: Ref<HTMLInputElement>;
}

/**
 * The Flutter app's field: a quiet filled pill with no ring at rest, a 2px
 * ring in primary on focus, and the same ring in error when invalid.
 *
 * Filled one step above `surface-container-low` because fields sit on cards
 * of that tone; the same fill would leave the field with no edge at all.
 */
export function TextField({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={inputId}
        className="px-5 text-[11px] font-medium text-on-surface-variant"
      >
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-12 rounded-pill bg-surface-container-high px-5 text-sm text-on-surface outline-none ring-2 ring-transparent transition placeholder:text-on-surface-variant focus-visible:outline-none focus:ring-primary ${error ? 'ring-error focus:ring-error' : ''}`}
      />
      {error ? (
        <p id={`${inputId}-error`} className="px-5 text-xs text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="px-5 text-[11px] text-on-surface-variant">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
