import type { NewUserInput } from '@/lib/schemas/user-inputs';

export interface ApiResult {
  ok: boolean;
  status: number;
  body: unknown;
}

export type ApiCall = (
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  accessToken?: string,
) => Promise<ApiResult>;

/**
 * Creates an account that can actually sign in.
 *
 * POST /users would be the obvious route, but UsersService.create stores the
 * password unhashed while login bcrypt-compares it, so such an account is
 * dead on arrival. /auth/register hashes it, but always makes a USER, so an
 * admin is promoted with a second call made on the current admin's behalf.
 */
export async function createUser(
  input: NewUserInput,
  adminAccessToken: string | undefined,
  call: ApiCall,
): Promise<ApiResult> {
  const registered = await call('POST', '/auth/register', {
    name: input.name,
    email: input.email,
    password: input.password,
  });
  if (!registered.ok) {
    return registered;
  }

  const user = (registered.body as { user: { id: string } }).user;
  if (input.role !== 'ADMIN') {
    return { ok: true, status: 201, body: user };
  }

  const promoted = await call('PATCH', `/users/${user.id}`, { role: 'ADMIN' }, adminAccessToken);
  if (!promoted.ok) {
    // The account exists now. Saying only "failed" would invite a retry that
    // runs into "email already exists".
    return {
      ok: false,
      status: promoted.status,
      body: {
        message: `${input.email} was created, but could not be made an administrator. Edit the user to try again.`,
        statusCode: promoted.status,
      },
    };
  }
  return { ok: true, status: 201, body: promoted.body };
}
