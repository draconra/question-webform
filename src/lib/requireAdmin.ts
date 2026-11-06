import { NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Auth gate for admin-only API routes.
 *
 * Checks `session?.user` rather than truthiness of `session` itself —
 * next-auth has had advisories where a misconfiguration (bad/missing
 * AUTH_SECRET, provider errors, etc.) populates `session` with an error
 * object instead of returning null, which a bare `if (!session)` check
 * fails open on. Requiring `user` on top of that is cheap insurance against
 * the same class of bug recurring.
 *
 * Returns the session on success, or a 401 NextResponse to return as-is.
 */
export async function requireAdmin(): Promise<
  | { ok: true }
  | { ok: false; response: NextResponse }
> {
  const session = await auth()
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { ok: true }
}
