import { NextResponse, type NextRequest } from 'next/server';

import { REFRESH_COOKIE, USER_COOKIE } from '@/lib/server/cookies';
import { parseSessionUser } from '@/lib/server/session';

export function GET(request: NextRequest) {
  const user = parseSessionUser(request.cookies.get(USER_COOKIE)?.value);
  if (!user || !request.cookies.has(REFRESH_COOKIE)) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
