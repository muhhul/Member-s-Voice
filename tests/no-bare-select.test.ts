import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Static guard for the password-hash leak.
 *
 * The unit test in columns.test.ts checks that adminUserSafeColumns matches
 * the schema. That is a check on the map, not on how anyone uses it - nothing
 * there stops a new file from calling db.select() with no arguments and
 * putting every column, password_hash included, into a rendered payload.
 *
 * This test reads the source instead, so the rule is enforced at the call
 * site where the mistake actually happens.
 */

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
    } else if (/\.tsx?$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

/** Strips comments so a rule written about code is not tripped by prose. */
function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const files = sourceFiles(SRC).map((path) => ({
  path: relative(process.cwd(), path).split("\\").join("/"),
  code: stripComments(readFileSync(path, "utf8")),
}));

describe("admin_users reads", () => {
  it("finds source files to scan", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("never selects from adminUsers without naming the columns", () => {
    // Whitespace-tolerant: covers both the one-line and the formatted form.
    const bareSelect = /\.select\(\s*\)[\s\S]{0,40}?\.from\(\s*adminUsers\s*\)/;
    const offenders = files.filter((f) => bareSelect.test(f.code)).map((f) => f.path);
    expect(offenders).toEqual([]);
  });

  it("keeps the credential columns to exactly one reader", () => {
    const readers = files
      .filter(
        (f) =>
          f.path !== "src/db/columns.ts" && f.code.includes("adminUserCredentialColumns"),
      )
      .map((f) => f.path);
    expect(readers).toEqual(["src/app/admin/login/actions.ts"]);
  });

  it("never passes a credential-column result into a render", () => {
    for (const file of files) {
      if (!file.code.includes("adminUserCredentialColumns")) continue;
      // A module that reads the hash must not also be a component module.
      expect(file.code).not.toMatch(/export default function/);
      expect(file.code).not.toMatch(/return\s*\(?\s*</);
    }
  });
});

describe("the guard itself", () => {
  it("would catch a bare select if one were reintroduced", () => {
    const bareSelect = /\.select\(\s*\)[\s\S]{0,40}?\.from\(\s*adminUsers\s*\)/;
    expect(bareSelect.test("const [u] = await db.select().from(adminUsers).limit(1);")).toBe(
      true,
    );
    expect(
      bareSelect.test(
        "const rows = await db\n  .select()\n  .from(adminUsers)\n  .where(eq(x, y));",
      ),
    ).toBe(true);
  });

  it("does not fire on a select that names its columns", () => {
    const bareSelect = /\.select\(\s*\)[\s\S]{0,40}?\.from\(\s*adminUsers\s*\)/;
    expect(
      bareSelect.test("db.select(adminUserSafeColumns).from(adminUsers).orderBy(x)"),
    ).toBe(false);
  });

  it("ignores bare selects on other tables", () => {
    const bareSelect = /\.select\(\s*\)[\s\S]{0,40}?\.from\(\s*adminUsers\s*\)/;
    expect(bareSelect.test("db.select().from(voices).limit(10)")).toBe(false);
  });
});
