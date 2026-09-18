import 'server-only';

import { cookies } from 'next/headers';

import { USER_COOKIE } from './cookies';
import { parseSessionUser, type SessionUser } from './session';

/** The signed-in user's display fields, for server components. */
export async function currentUser(): Promise<SessionUser | null> {
  return parseSessionUser((await cookies()).get(USER_COOKIE)?.value);
}
