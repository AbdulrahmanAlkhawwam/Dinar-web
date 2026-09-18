export interface DinarClaims {
  sub: string;
  email: string;
  role: string;
  exp: number;
}

/**
 * Reads a JWT's payload WITHOUT verifying its signature. The dashboard only
 * uses this for cookie lifetimes and to decide which navigation to show; the
 * Dinar API verifies every token it is actually handed.
 */
export function decodeJwt(token: string): DinarClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as DinarClaims).sub !== 'string' ||
    typeof (payload as DinarClaims).email !== 'string' ||
    typeof (payload as DinarClaims).role !== 'string' ||
    typeof (payload as DinarClaims).exp !== 'number'
  ) {
    return null;
  }

  const { sub, email, role, exp } = payload as DinarClaims;
  return { sub, email, role, exp };
}

/** How long a cookie holding this token should live. */
export function secondsUntilExpiry(token: string, now = Date.now()): number {
  const claims = decodeJwt(token);
  if (!claims) {
    return 0;
  }
  return Math.max(0, claims.exp - Math.floor(now / 1000));
}
