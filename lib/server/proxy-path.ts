/**
 * Turns the `[...path]` segments of /api/dinar/* into a path under the Dinar
 * API, or null if the request must not be forwarded.
 *
 * Refused:
 * - `auth/*` — login and refresh return raw tokens in the body. Those go
 *   through /api/auth/*, which stores them in httpOnly cookies instead.
 * - `.` and `..` — fetch() normalises them away, which would let a request
 *   escape the `/api/v1` prefix.
 */
export function resolveProxyPath(
  segments: readonly string[],
  search: string,
): string | null {
  if (segments.length === 0) {
    return null;
  }
  if (segments[0].toLowerCase() === 'auth') {
    return null;
  }
  if (segments.some((segment) => segment === '.' || segment === '..')) {
    return null;
  }

  return `/${segments.map(encodeURIComponent).join('/')}${search}`;
}
