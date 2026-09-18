export interface ForwardRequest {
  baseUrl: string;
  /** Path under the API base, including any query string. */
  path: string;
  method: string;
  /** Already read into memory, so it can be sent a second time. */
  body?: string;
  contentType?: string;
  accessToken?: string;
  refreshToken?: string;
  fetch?: typeof fetch;
}

export interface ForwardResult {
  response: Response;
  /** Set when the access token was refreshed; the caller must store it. */
  accessToken?: string;
  /** The session cannot be recovered; the caller must clear its cookies. */
  clearSession: boolean;
}

function send(
  request: ForwardRequest,
  accessToken: string | undefined,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const headers = new Headers({ accept: 'application/json' });
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }
  if (request.body !== undefined) {
    headers.set('content-type', request.contentType ?? 'application/json');
  }

  return fetchImpl(`${request.baseUrl}${request.path}`, {
    method: request.method,
    headers,
    body: request.body,
    cache: 'no-store',
  });
}

async function refresh(
  baseUrl: string,
  refreshToken: string,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  const response = await fetchImpl(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  });
  if (!response.ok) {
    return null;
  }

  const body = (await response.json()) as { accessToken?: unknown };
  return typeof body.accessToken === 'string' ? body.accessToken : null;
}

/**
 * Sends a request to the Dinar API on the user's behalf.
 *
 * Access tokens live 15 minutes, so a 401 usually just means "expired". On a
 * 401 this refreshes once and replays the same request; only if that fails
 * is the session over. A 403 is a different thing — signed in but not an
 * admin — and is returned untouched.
 */
export async function forward(request: ForwardRequest): Promise<ForwardResult> {
  const fetchImpl = request.fetch ?? fetch;

  const first = await send(request, request.accessToken, fetchImpl);
  if (first.status !== 401) {
    return { response: first, clearSession: false };
  }

  if (!request.refreshToken) {
    return { response: first, clearSession: true };
  }

  const accessToken = await refresh(
    request.baseUrl,
    request.refreshToken,
    fetchImpl,
  );
  if (!accessToken) {
    return { response: first, clearSession: true };
  }

  const replay = await send(request, accessToken, fetchImpl);
  if (replay.status === 401) {
    return { response: replay, clearSession: true };
  }

  return { response: replay, accessToken, clearSession: false };
}
