import 'server-only';

import type { NextResponse } from 'next/server';
import { z } from 'zod';

import type { User } from '@/lib/schemas/user';
import { roleSchema } from '@/lib/schemas/user';

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  USER_COOKIE,
  sessionCookieOptions,
} from './cookies';
import { secondsUntilExpiry } from './jwt';

export const DINAR_API_URL =
  process.env.DINAR_API_URL ?? 'https://dinar-api-rust.vercel.app/api/v1';

export const sessionUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: roleSchema,
});

export type SessionUser = z.infer<typeof sessionUserSchema>;

export function toSessionUser(user: User): SessionUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export function parseSessionUser(raw: string | undefined): SessionUser | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = sessionUserSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeAccessToken(response: NextResponse, accessToken: string) {
  response.cookies.set(
    ACCESS_COOKIE,
    accessToken,
    sessionCookieOptions(secondsUntilExpiry(accessToken)),
  );
}

/** Stores a full session. Everything lives as long as the refresh token. */
export function writeSession(
  response: NextResponse,
  session: { accessToken: string; refreshToken: string; user: SessionUser },
) {
  const lifetime = secondsUntilExpiry(session.refreshToken);

  writeAccessToken(response, session.accessToken);
  response.cookies.set(
    REFRESH_COOKIE,
    session.refreshToken,
    sessionCookieOptions(lifetime),
  );
  response.cookies.set(
    USER_COOKIE,
    JSON.stringify(session.user),
    sessionCookieOptions(lifetime),
  );
}

export function clearSession(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE]) {
    response.cookies.set(name, '', sessionCookieOptions(0));
  }
}
