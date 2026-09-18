import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

import { ApiError } from './api-error';

/**
 * Puts a failed submission's messages where they belong: on the fields they
 * name, or — when they name none — in the form-level message.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  setFormError: (message: string) => void,
) {
  if (!(error instanceof ApiError)) {
    setFormError('Could not reach the server. Check your connection.');
    return;
  }
  if (error.status === 403) {
    setFormError('Administrator access is required for this.');
    return;
  }

  const entries = Object.entries(error.fieldErrors);
  for (const [field, message] of entries) {
    setError(field as Path<T>, { message });
  }
  if (entries.length === 0) {
    setFormError(error.message);
  }
}
