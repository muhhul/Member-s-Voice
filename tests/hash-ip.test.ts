import { describe, expect, it } from "vitest";
import { clientIpFromHeaders, hashIp } from "@/lib/hash-ip";

describe("hashIp", () => {
  it("returns a 64 character hex digest", () => {
    expect(hashIp("203.0.113.9", "salt")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is stable for the same ip and salt", () => {
    expect(hashIp("203.0.113.9", "salt")).toBe(hashIp("203.0.113.9", "salt"));
  });

  it("produces a different digest for a different salt", () => {
    expect(hashIp("203.0.113.9", "a")).not.toBe(hashIp("203.0.113.9", "b"));
  });

  it("does not contain the raw ip", () => {
    expect(hashIp("203.0.113.9", "salt")).not.toContain("203.0.113.9");
  });
});

describe("clientIpFromHeaders", () => {
  it("takes the first entry of x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "203.0.113.10" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.10");
  });

  it("returns null when no forwarding header is present", () => {
    expect(clientIpFromHeaders(new Headers())).toBeNull();
  });
});
