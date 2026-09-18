import 'server-only';

import { NextResponse } from 'next/server';
import type { z } from 'zod';

import { DINAR_API_URL } from './session';

export interface ApiResult {
  ok: boolean;
  status: number;
  body: unknown;
}

/** POSTs JSON to the Dinar API. Used by the auth routes, which hold no session yet. */
export async function callApi(
  path: string,
  payload: unknown,
  accessToken?: string,
): Promise<ApiResult> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    accept: 'application/json',
  };
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${DINAR_API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  return {
    ok: response.ok,
    status: response.status,
    body: await response.json().catch(() => ({})),
  };
}

/**
 * Mirrors Nest's ValidationPipe shape — `{ message: string[], statusCode }` —
 * so the client parses local and upstream validation errors the same way.
 */
export function invalidInput(error: z.ZodError) {
  return NextResponse.json(
    {
      message: error.issues.map((issue) =>
        issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message,
      ),
      statusCode: 400,
    },
    { status: 400 },
  );
}
