import { describe, expect, it } from "vitest";
import {
  createUserSchema,
  fieldErrors,
  filtersSchema,
  loginSchema,
  voiceSchema,
} from "@/lib/validation";

describe("voiceSchema", () => {
  it("accepts a valid submission and trims the message", () => {
    const parsed = voiceSchema.parse({
      category: "safety",
      message: "  Lantai di area press licin setelah hujan.  ",
    });
    expect(parsed.message).toBe("Lantai di area press licin setelah hujan.");
    expect(parsed.category).toBe("safety");
  });

  it("rejects a category that is not in the list", () => {
    const result = voiceSchema.safeParse({ category: "other", message: "x".repeat(20) });
    expect(result.success).toBe(false);
  });

  it("rejects a message shorter than 10 characters after trimming", () => {
    const result = voiceSchema.safeParse({ category: "hr", message: "   short   " });
    expect(result.success).toBe(false);
  });

  it("rejects a message longer than 2000 characters", () => {
    const result = voiceSchema.safeParse({ category: "hr", message: "a".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it("has no area field in its output", () => {
    const parsed = voiceSchema.parse({
      category: "hr",
      message: "a".repeat(20),
      area: "office",
    });
    expect(parsed).not.toHaveProperty("area");
  });
});

describe("loginSchema", () => {
  it("lowercases and trims the email", () => {
    const parsed = loginSchema.parse({ email: "  Budi@Example.COM ", password: "secret" });
    expect(parsed.email).toBe("budi@example.com");
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "budi", password: "secret" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "budi@example.com", password: "" }).success).toBe(false);
  });
});

describe("createUserSchema", () => {
  it("accepts a valid viewer", () => {
    const parsed = createUserSchema.parse({
      email: "viewer@example.com",
      name: "Viewer Satu",
      role: "viewer",
      password: "correct horse battery",
    });
    expect(parsed.role).toBe("viewer");
  });

  it("rejects a password shorter than 12 characters", () => {
    const result = createUserSchema.safeParse({
      email: "viewer@example.com",
      name: "Viewer Satu",
      role: "viewer",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a role outside master and viewer", () => {
    const result = createUserSchema.safeParse({
      email: "viewer@example.com",
      name: "Viewer Satu",
      role: "admin",
      password: "correct horse battery",
    });
    expect(result.success).toBe(false);
  });
});

describe("filtersSchema", () => {
  it("defaults page to 1 and drops empty strings", () => {
    const parsed = filtersSchema.parse({ category: "", from: "", to: "", q: "", page: "" });
    expect(parsed).toEqual({ page: 1 });
  });

  it("keeps valid values and coerces page", () => {
    const parsed = filtersSchema.parse({
      category: "safety",
      from: "2026-01-01",
      to: "2026-01-31",
      q: "licin",
      page: "3",
    });
    expect(parsed).toEqual({
      category: "safety",
      from: "2026-01-01",
      to: "2026-01-31",
      q: "licin",
      page: 3,
    });
  });

  it("drops a malformed date instead of failing", () => {
    const parsed = filtersSchema.parse({ from: "01/01/2026", page: "1" });
    expect(parsed.from).toBeUndefined();
  });

  it("clamps a page below 1 up to 1", () => {
    expect(filtersSchema.parse({ page: "-4" }).page).toBe(1);
  });
});

describe("fieldErrors", () => {
  it("returns the first message per field, keyed by field name", () => {
    const result = voiceSchema.safeParse({ category: "nope", message: "" });
    if (result.success) throw new Error("expected a validation failure");
    const errors = fieldErrors(result.error);
    expect(Object.keys(errors).sort()).toEqual(["category", "message"]);
    expect(typeof errors.message).toBe("string");
  });
});
