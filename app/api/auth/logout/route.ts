import { NextResponse, type NextRequest } from 'next/server';

import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/server/cookies';
import { forward } from '@/lib/server/forward';
import { DINAR_API_URL, clearSession } from '@/lib/server/session';

export async function POST(request: NextRequest) {
  // Best effort: tell the API to forget the refresh token. `forward` refreshes
  // an expired access token first, so this still works after 15 minutes. The
  // local session ends whatever the API says.
  await forward({
    baseUrl: DINAR_API_URL,
    path: '/auth/logout',
    method: 'POST',
    accessToken: request.cookies.get(ACCESS_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_COOKIE)?.value,
  }).catch(() => undefined);

  const response = NextResponse.json({ ok: true });
  clearSession(response);
  return response;
}
