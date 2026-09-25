import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "@/lib/turnstile";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.TURNSTILE_SECRET_KEY;
  vi.restoreAllMocks();
});

describe("verifyTurnstile", () => {
  it("allows the request when no secret key is configured", async () => {
    await expect(verifyTurnstile(null)).resolves.toBe(true);
  });

  it("rejects a missing token when a secret key is configured", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    await expect(verifyTurnstile(null)).resolves.toBe(false);
  });

  it("returns true when Cloudflare reports success", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ success: true }), { status: 200 }),
    ) as unknown as typeof fetch;
    await expect(verifyTurnstile("token")).resolves.toBe(true);
  });

  it("returns false when Cloudflare reports failure", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] }), {
          status: 200,
        }),
    ) as unknown as typeof fetch;
    await expect(verifyTurnstile("token")).resolves.toBe(false);
  });

  it("returns false when the verify call throws", async () => {
    process.env.TURNSTILE_SECRET_KEY = "secret";
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    await expect(verifyTurnstile("token")).resolves.toBe(false);
  });
});
