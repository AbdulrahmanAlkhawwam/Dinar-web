import { NextResponse, type NextRequest } from 'next/server';

import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/server/cookies';
import { forward } from '@/lib/server/forward';
import { resolveProxyPath } from '@/lib/server/proxy-path';
import {
  DINAR_API_URL,
  clearSession,
  writeAccessToken,
} from '@/lib/server/session';

async function handle(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const path = resolveProxyPath(segments, request.nextUrl.search);
  if (!path) {
    return NextResponse.json(
      { message: 'Not found', statusCode: 404 },
      { status: 404 },
    );
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const result = await forward({
    baseUrl: DINAR_API_URL,
    path,
    method: request.method,
    body: hasBody ? await request.text() : undefined,
    contentType: request.headers.get('content-type') ?? undefined,
    accessToken: request.cookies.get(ACCESS_COOKIE)?.value,
    refreshToken: request.cookies.get(REFRESH_COOKIE)?.value,
  });

  const response = new NextResponse(result.response.body, {
    status: result.response.status,
    headers: {
      'content-type':
        result.response.headers.get('content-type') ?? 'application/json',
    },
  });
  if (result.accessToken) {
    writeAccessToken(response, result.accessToken);
  }
  if (result.clearSession) {
    clearSession(response);
  }
  return response;
}

export { handle as DELETE, handle as GET, handle as PATCH, handle as POST };
