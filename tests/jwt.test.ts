import { beforeEach, describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "@/lib/jwt";

beforeEach(() => {
  process.env.AUTH_SECRET = "test-secret-value-that-is-long-enough";
});

describe("session tokens", () => {
  it("round-trips a payload", async () => {
    const token = await signSessionToken({ uid: "abc-123", role: "master" });
    await expect(verifySessionToken(token)).resolves.toEqual({ uid: "abc-123", role: "master" });
  });

  it("returns null for a garbage token", async () => {
    await expect(verifySessionToken("not-a-jwt")).resolves.toBeNull();
  });

  it("returns null when the token was signed with another secret", async () => {
    const token = await signSessionToken({ uid: "abc-123", role: "viewer" });
    process.env.AUTH_SECRET = "a-completely-different-secret-value";
    await expect(verifySessionToken(token)).resolves.toBeNull();
  });

  it("throws when AUTH_SECRET is missing", async () => {
    delete process.env.AUTH_SECRET;
    await expect(signSessionToken({ uid: "abc-123", role: "viewer" })).rejects.toThrow(
      /AUTH_SECRET/,
    );
  });
});
