import { useId, type Ref, type SelectHTMLAttributes } from 'react';

export interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}

/** The native select, dressed as a TextField so the two sit together. */
export function SelectField({
  label,
  error,
  id,
  className = '',
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={selectId} className="px-5 text-[11px] font-medium text-on-surface-variant">
        {label}
      </label>
      <select
        {...props}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${selectId}-error` : undefined}
        className={`h-12 appearance-none rounded-pill bg-surface-container-high bg-[length:12px] bg-[position:right_1.25rem_center] bg-no-repeat px-5 pr-10 text-sm text-on-surface outline-none ring-2 ring-transparent transition focus:ring-primary ${error ? 'ring-error focus:ring-error' : ''}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23888' stroke-width='2'/%3E%3C/svg%3E\")",
        }}
      >
        {children}
      </select>
      {error ? (
        <p id={`${selectId}-error`} className="px-5 text-xs text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
