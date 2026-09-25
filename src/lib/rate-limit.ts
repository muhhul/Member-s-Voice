import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { hashIp } from "@/lib/hash-ip";

export type RedisCredentials = { url: string; token: string };

/**
 * Upstash's own SDK reads UPSTASH_REDIS_REST_URL / _TOKEN, but Vercel's
 * Upstash integration writes the same values as KV_REST_API_URL / _TOKEN.
 * Accepting both means the deployed app works without anyone hand-copying
 * tokens between dashboard fields.
 *
 * Returns null unless a complete pair is present - half a pair is a
 * misconfiguration, not a usable connection.
 */
export function redisCredentials(): RedisCredentials | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url, token } : null;
}

type RateLimitConfig = { credentials: RedisCredentials; salt: string };

/**
 * The single place that decides whether rate limiting is configured. Both the
 * boolean check and the limiter itself read from here, so they cannot drift
 * apart, and the salt arrives already narrowed to a string.
 */
function rateLimitConfig(): RateLimitConfig | null {
  const credentials = redisCredentials();
  const salt = process.env.RATE_LIMIT_SALT;
  return credentials && salt ? { credentials, salt } : null;
}

export function isRateLimitEnabled(): boolean {
  return rateLimitConfig() !== null;
}

let limiter: Ratelimit | null = null;

function getLimiter(credentials: RedisCredentials): Ratelimit {
  if (!limiter) {
    limiter = new Ratelimit({
      redis: new Redis(credentials),
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
  const config = rateLimitConfig();
  if (!config || !ip) return true;

  try {
    const key = hashIp(ip, config.salt);
    const { success } = await getLimiter(config.credentials).limit(key);
    return success;
  } catch {
    // Deliberately logs nothing: every value in scope here derives from the
    // request, and the submit path stays silent.
    return true;
  }
}
