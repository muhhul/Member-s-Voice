import { describe, expect, it } from "vitest";
import { formatDateJakarta, jakartaDayEndExclusive, jakartaDayStart } from "@/lib/format";

describe("formatDateJakarta", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(formatDateJakarta(new Date("2026-03-15T04:00:00Z"))).toBe("2026-03-15");
  });

  it("uses the Jakarta day, not the UTC day", () => {
    // 18:00 UTC is already 01:00 the next day in Jakarta (UTC+7).
    expect(formatDateJakarta(new Date("2026-01-31T18:00:00Z"))).toBe("2026-02-01");
  });

  it("never leaks a time component", () => {
    expect(formatDateJakarta(new Date("2026-03-15T23:59:59Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("jakartaDayStart", () => {
  it("resolves to 17:00 UTC the previous day", () => {
    expect(jakartaDayStart("2026-01-31").toISOString()).toBe("2026-01-30T17:00:00.000Z");
  });
});

describe("jakartaDayEndExclusive", () => {
  it("is exactly 24 hours after the day start", () => {
    const start = jakartaDayStart("2026-01-31").getTime();
    expect(jakartaDayEndExclusive("2026-01-31").getTime() - start).toBe(86_400_000);
  });

  it("includes a voice submitted late on the to-date", () => {
    const lateInJakarta = new Date("2026-01-31T16:30:00Z"); // 23:30 waktu Jakarta
    expect(lateInJakarta.getTime()).toBeLessThan(jakartaDayEndExclusive("2026-01-31").getTime());
  });
});
