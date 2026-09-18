import type { z } from 'zod';

import { toApiError } from './api-error';

interface RequestOptions<T extends z.ZodType> {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Validates the response; omit for endpoints whose body we ignore. */
  schema?: T;
  /** Form fields, so validation messages can be attached to them. */
  fields?: readonly string[];
}

/**
 * Calls the BFF. `url` is a same-origin path — `/api/dinar/...` for data,
 * `/api/auth/...` for the session. Throws ApiError on any non-2xx.
 */
export async function request<T extends z.ZodType = z.ZodUnknown>(
  url: string,
  { method = 'GET', body, schema, fields }: RequestOptions<T> = {},
): Promise<z.infer<T>> {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    // The BFF has already tried a refresh; a 401 here means the session is
    // gone. Auth routes are excluded so a wrong password stays on the form.
    if (response.status === 401 && !url.startsWith('/api/auth/')) {
      // A full reload on purpose, not router.push: it drops the React Query
      // cache, so the next person to sign in never sees this user's data.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
    }
    throw toApiError(response.status, payload, fields);
  }

  return schema ? schema.parse(payload) : (payload as z.infer<T>);
}
