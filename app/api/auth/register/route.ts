import { NextResponse, type NextRequest } from 'next/server';

import {
  loginResponseSchema,
  registerInputSchema,
  registerResponseSchema,
} from '@/lib/schemas/auth';
import { callApi, invalidInput } from '@/lib/server/api';
import { toSessionUser, writeSession } from '@/lib/server/session';

export async function POST(request: NextRequest) {
  const input = registerInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!input.success) {
    return invalidInput(input.error);
  }

  const registered = await callApi('/auth/register', input.data);
  if (!registered.ok) {
    return NextResponse.json(registered.body, { status: registered.status });
  }
  registerResponseSchema.parse(registered.body);

  // Register returns no refresh token, so a session built from it would end
  // after 15 minutes. Log in straight away to get the full pair.
  const login = await callApi('/auth/login', {
    email: input.data.email,
    password: input.data.password,
  });
  if (!login.ok) {
    return NextResponse.json(login.body, { status: login.status });
  }

  const session = loginResponseSchema.parse(login.body);
  const user = toSessionUser(session.user);
  const response = NextResponse.json({ user }, { status: 201 });
  writeSession(response, { ...session, user });
  return response;
}
