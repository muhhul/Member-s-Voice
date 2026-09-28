import { PgDialect } from "drizzle-orm/pg-core";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { voiceWhere } from "@/lib/queries";
import { filtersSchema } from "@/lib/validation";

/**
 * Serialises a filter into the SQL it will actually run, without touching a
 * database. This is the layer that decides which voices management can see, so
 * it deserves a test that does not depend on a live connection.
 */
const dialect = new PgDialect();

function sqlFor(raw: Record<string, string | undefined>) {
  const condition = voiceWhere(filtersSchema.parse(raw));
  if (!condition) return { sql: "", params: [] as unknown[] };
  const query = dialect.sqlToQuery(condition);
  return { sql: query.sql, params: query.params };
}

describe("importing the query layer", () => {
  const saved = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (saved) process.env.DATABASE_URL = saved;
  });

  /**
   * The database client used to build its connection at import time, so this
   * module threw the moment it was loaded without DATABASE_URL. That is why
   * this file had no tests at all, and why `next build` needed a live
   * connection string just to compile.
   */
  it("does not need DATABASE_URL just to be imported", async () => {
    await expect(import("@/lib/queries")).resolves.toBeDefined();
  });
});

describe("voiceWhere", () => {
  it("produces no condition when nothing is filtered", () => {
    expect(sqlFor({}).sql).toBe("");
  });

  it("filters by category", () => {
    const { sql, params } = sqlFor({ category: "safety" });
    expect(sql).toContain('"category"');
    expect(params).toContain("safety");
  });

  it("ignores a category that is not in the list", () => {
    expect(sqlFor({ category: "ngawur" }).sql).toBe("");
  });

  it("turns the from-date into a lower bound on created_at", () => {
    const { sql, params } = sqlFor({ from: "2026-03-15" });
    expect(sql).toContain('"created_at" >=');
    // Midnight Jakarta time is 17:00 UTC on the previous day.
    expect(params[0]).toBe("2026-03-14T17:00:00.000Z");
  });

  it("uses an exclusive upper bound so the whole to-date is included", () => {
    const { sql, params } = sqlFor({ to: "2026-03-15" });
    // Strictly less-than, against midnight on the following day.
    expect(sql).toContain('"created_at" <');
    expect(sql).not.toContain('"created_at" <=');
    // The bound is midnight Jakarta on the FOLLOWING day, so a voice sent at
    // 23:30 on the "to" date is still included.
    expect(params[0]).toBe("2026-03-15T17:00:00.000Z");
  });

  it("searches the message case-insensitively", () => {
    const { sql, params } = sqlFor({ q: "licin" });
    expect(sql.toLowerCase()).toContain("ilike");
    expect(params).toContain("%licin%");
  });

  /**
   * Without escaping, a search for "%" becomes a wildcard that matches every
   * row - a viewer could pull the whole table by typing one character.
   */
  it("escapes LIKE wildcards in the search term", () => {
    expect(sqlFor({ q: "100%" }).params).toContain("%100\\%%");
    expect(sqlFor({ q: "shift_2" }).params).toContain("%shift\\_2%");
  });

  it("combines every filter into one condition", () => {
    const { sql, params } = sqlFor({
      category: "hr",
      from: "2026-01-01",
      to: "2026-01-31",
      q: "shift",
    });
    expect(sql).toContain('"category"');
    expect(sql).toContain('"created_at" >=');
    expect(sql).toContain('"created_at" <');
    expect(sql.toLowerCase()).toContain("ilike");
    expect(params).toHaveLength(4);
  });

  it("never references a column that could identify the sender", () => {
    const { sql } = sqlFor({ category: "hr", q: "shift" });
    for (const forbidden of ["ip", "user", "agent", "device", "session"]) {
      expect(sql.toLowerCase()).not.toContain(forbidden);
    }
  });
});
