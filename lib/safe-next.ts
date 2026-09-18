/**
 * The page to land on after signing in, taken from `?next=`. Only a path on
 * this site is accepted — otherwise the login page becomes an open redirect.
 * Browsers treat both `//host` and `/\host` as another origin.
 */
export function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return '/';
  }
  return next;
}
