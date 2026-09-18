import { useId, type Ref, type TextareaHTMLAttributes } from 'react';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

/** TextField's multi-line sibling. Rounded to the inner radius, not a pill. */
export function TextArea({ label, error, hint, id, className = '', ...props }: TextAreaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={inputId} className="px-5 text-[11px] font-medium text-on-surface-variant">
        {label}
      </label>
      <textarea
        rows={3}
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`resize-y rounded-inner bg-surface-container-high px-5 py-3 text-sm text-on-surface outline-none ring-2 ring-transparent transition placeholder:text-on-surface-variant focus:ring-primary ${error ? 'ring-error focus:ring-error' : ''}`}
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
