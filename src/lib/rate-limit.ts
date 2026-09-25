import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hashIp } from "@/lib/hash-ip";

export function isRateLimitEnabled(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      process.env.RATE_LIMIT_SALT,
  );
}

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit {
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "mv:submit",
      analytics: false,
    });
  }
  return limiter;
}

/**
 * Returns true when the submission is allowed.
 *
 * Fails open: if Upstash is unreachable, a genuine employee must still be able
 * to submit. Losing spam protection for a moment is a smaller failure than
 * silently dropping real feedback.
 */
export async function checkRateLimit(ip: string | null): Promise<boolean> {
  if (!isRateLimitEnabled() || !ip) return true;

  try {
    const key = hashIp(ip, process.env.RATE_LIMIT_SALT!);
    const { success } = await getLimiter().limit(key);
    return success;
  } catch {
    // Deliberately logs nothing: every value in scope here derives from the
    // request, and the submit path stays silent.
    return true;
  }
}
