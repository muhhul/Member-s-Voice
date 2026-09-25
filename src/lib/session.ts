import "server-only";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { adminUsers, type AdminUser } from "@/db/schema";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signSessionToken,
  verifySessionToken,
  type Role,
  type SessionPayload,
} from "@/lib/jwt";

/** Only callable from a Server Action or Route Handler. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSessionToken(payload);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Local development runs over http, where a Secure cookie is dropped.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

/** Only callable from a Server Action or Route Handler. */
export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

/**
 * Verifies the JWT AND re-reads the account from the database, so a
 * deactivated or demoted account loses access on its very next request even
 * though its cookie is still cryptographically valid.
 *
 * Returns null instead of redirecting, for callers that need to answer with a
 * status code (the CSV route handler) rather than a redirect.
 */
export async function getAuthorizedUser(allowed: Role[]): Promise<AdminUser | null> {
  const session = await getSession();
  if (!session) return null;

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, session.uid))
    .limit(1);

  if (!user || !user.isActive) return null;
  if (!allowed.includes(user.role)) return null;
  return user;
}

/**
 * The authorization gate every admin page and server action must call.
 * Does not touch cookies: Next.js forbids cookie writes during a render.
 */
export async function requireRole(allowed: Role[]): Promise<AdminUser> {
  const user = await getAuthorizedUser(allowed);
  if (!user) redirect("/admin/login");
  return user;
}
