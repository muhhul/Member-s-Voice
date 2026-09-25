import { createHash } from "node:crypto";

/**
 * ANONYMITY REQUIREMENT: the result of this function is used only as a
 * short-lived Redis rate-limit key. It must never be written to Postgres and
 * must never appear on or near a voices row.
 */
export function hashIp(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function clientIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip")?.trim();
  return real ? real : null;
}
