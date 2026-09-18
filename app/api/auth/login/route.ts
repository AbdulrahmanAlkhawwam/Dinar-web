import { NextResponse, type NextRequest } from 'next/server';

import { loginInputSchema, loginResponseSchema } from '@/lib/schemas/auth';
import { callApi, invalidInput } from '@/lib/server/api';
import { toSessionUser, writeSession } from '@/lib/server/session';

export async function POST(request: NextRequest) {
  const input = loginInputSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return invalidInput(input.error);
  }

  const result = await callApi('/auth/login', input.data);
  if (!result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  const session = loginResponseSchema.parse(result.body);
  const user = toSessionUser(session.user);
  const response = NextResponse.json({ user });
  writeSession(response, { ...session, user });
  return response;
}
