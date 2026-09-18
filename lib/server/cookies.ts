export const ACCESS_COOKIE = 'dinar_at';
export const REFRESH_COOKIE = 'dinar_rt';
/** Display fields only (name, email, role) — the API has no /me endpoint. */
export const USER_COOKIE = 'dinar_user';

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax';
  path: '/';
  maxAge: number;
}

export function sessionCookieOptions(
  maxAge: number,
  secure = process.env.NODE_ENV === 'production',
): SessionCookieOptions {
  return { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge };
}
