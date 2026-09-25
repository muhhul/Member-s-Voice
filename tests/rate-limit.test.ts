import { afterEach, describe, expect, it } from "vitest";
import { isRateLimitEnabled, redisCredentials } from "@/lib/rate-limit";

const KEYS = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "RATE_LIMIT_SALT",
];

afterEach(() => {
  for (const key of KEYS) delete process.env[key];
});

describe("redisCredentials", () => {
  it("returns null when nothing is configured", () => {
    expect(redisCredentials()).toBeNull();
  });

  it("reads the Upstash-native variable names", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://a.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-a";
    expect(redisCredentials()).toEqual({ url: "https://a.upstash.io", token: "token-a" });
  });

  it("falls back to the KV_* names Vercel's Upstash integration creates", () => {
    process.env.KV_REST_API_URL = "https://b.upstash.io";
    process.env.KV_REST_API_TOKEN = "token-b";
    expect(redisCredentials()).toEqual({ url: "https://b.upstash.io", token: "token-b" });
  });

  it("prefers the Upstash-native names when both are present", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://a.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-a";
    process.env.KV_REST_API_URL = "https://b.upstash.io";
    process.env.KV_REST_API_TOKEN = "token-b";
    expect(redisCredentials()?.url).toBe("https://a.upstash.io");
  });

  it("returns null when only half a pair is present", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://a.upstash.io";
    expect(redisCredentials()).toBeNull();
  });
});

describe("isRateLimitEnabled", () => {
  it("is false without a salt, even when Redis is configured", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://a.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-a";
    expect(isRateLimitEnabled()).toBe(false);
  });

  it("is true once Redis and the salt are both configured", () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://a.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token-a";
    process.env.RATE_LIMIT_SALT = "salt";
    expect(isRateLimitEnabled()).toBe(true);
  });
});
