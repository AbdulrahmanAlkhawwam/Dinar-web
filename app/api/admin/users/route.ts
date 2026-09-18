import { NextResponse, type NextRequest } from 'next/server';

import { newUserInputSchema } from '@/lib/schemas/user-inputs';
import { invalidInput } from '@/lib/server/api';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '@/lib/server/cookies';
import { createUser, type ApiCall } from '@/lib/server/create-user';
import { forward } from '@/lib/server/forward';
import { decodeJwt } from '@/lib/server/jwt';
import { DINAR_API_URL, clearSession, writeAccessToken } from '@/lib/server/session';

/**
 * Creates a user that can sign in — see createUser for why this is not a
 * plain proxy to POST /users.
 */
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  // /auth/register is public, so this route checks for an admin itself. The
  // role comes from the unverified token payload: enough to stop a member
  // using this route, while the API remains the real authority on the PATCH.
  if (decodeJwt(refreshToken ?? '')?.role !== 'ADMIN') {
    return NextResponse.json(
      { message: 'Administrator access is required', statusCode: 403 },
      { status: 403 },
    );
  }

  const input = newUserInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return invalidInput(input.error);
  }

  let refreshedToken: string | undefined;
  let sessionEnded = false;
  const call: ApiCall = async (method, path, body, accessToken) => {
    const result = await forward({
      baseUrl: DINAR_API_URL,
      path,
      method,
      body: JSON.stringify(body),
      accessToken,
      // Only the admin's own call carries credentials worth refreshing.
      refreshToken: accessToken ? refreshToken : undefined,
    });
    refreshedToken ??= result.accessToken;
    sessionEnded ||= result.clearSession && accessToken !== undefined;
    return {
      ok: result.response.ok,
      status: result.response.status,
      body: await result.response.json().catch(() => ({})),
    };
  };

  const result = await createUser(input.data, request.cookies.get(ACCESS_COOKIE)?.value, call);

  const response = NextResponse.json(result.body, { status: result.status });
  if (refreshedToken) writeAccessToken(response, refreshedToken);
  if (sessionEnded) clearSession(response);
  return response;
}
