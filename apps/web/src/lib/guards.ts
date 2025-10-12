// Server-only guards (no Response returns here)

export type Role = 'admin' | 'driver' | 'customer';

type HasRole = { user?: { id?: string; email?: string; name?: string; role?: string } };

export function assertSession(session: unknown): asserts session is HasRole {
  if (!session) throw new Error('UNAUTHORIZED');
}

export function assertRole(
  session: HasRole,
  roles: Role[]
): asserts session is HasRole & { user: { id: string; email: string; name: string; role: Role } } {
  const role = session?.user?.role;
  if (!role || !roles.includes(role as Role)) throw new Error('FORBIDDEN');
}

export function assertDriver(
  session: HasRole
): asserts session is HasRole & { user: { id: string; email: string; name: string; role: 'driver' } } {
  assertRole(session, ['driver']);
}

export function ensureDriver(session: unknown): Response | null {
  try { assertDriver(session as any); return null; }
  catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }
}