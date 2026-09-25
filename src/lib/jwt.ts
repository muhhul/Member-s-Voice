import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "mv_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type Role = "master" | "viewer";
export type SessionPayload = { uid: string; role: Role };

/**
 * EDGE-SAFE MODULE. src/middleware.ts imports this file, so it must never
 * import next/headers, node:crypto, bcryptjs, or the database client.
 */
function encodedSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.uid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(encodedSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret(), { algorithms: ["HS256"] });
    const uid = payload.sub;
    const role = payload.role;
    if (typeof uid !== "string" || uid === "") return null;
    if (role !== "master" && role !== "viewer") return null;
    return { uid, role };
  } catch {
    return null;
  }
}
