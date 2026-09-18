import { NextResponse, type NextRequest } from 'next/server';

import { REFRESH_COOKIE, USER_COOKIE } from '@/lib/server/cookies';

const PUBLIC_PAGES = ['/login', '/register'];
const ADMIN_PAGES = ['/users'];

function readRole(request: NextRequest): string | null {
  try {
    const raw = request.cookies.get(USER_COOKIE)?.value;
    return raw ? (JSON.parse(raw) as { role?: string }).role ?? null : null;
  } catch {
    return null;
  }
}

/**
 * Routing only. Presence of the refresh cookie decides signed-in vs not; the
 * role decides whether admin pages are shown. Neither is a security check —
 * the Dinar API verifies the token on every request the dashboard makes.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = request.cookies.has(REFRESH_COOKIE);
  const isPublic = PUBLIC_PAGES.some((page) => pathname.startsWith(page));

  if (!signedIn && !isPublic) {
    const login = new URL('/login', request.url);
    if (pathname !== '/') {
      login.searchParams.set('next', pathname);
    }
    return NextResponse.redirect(login);
  }

  if (signedIn && isPublic) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (
    ADMIN_PAGES.some((page) => pathname.startsWith(page)) &&
    readRole(request) !== 'ADMIN'
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
