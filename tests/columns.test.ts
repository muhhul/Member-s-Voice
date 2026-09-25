import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { adminUserSafeColumns } from "@/db/columns";
import { adminUsers } from "@/db/schema";

describe("adminUserSafeColumns", () => {
  it("never exposes the password hash", () => {
    expect(Object.keys(adminUserSafeColumns)).not.toContain("passwordHash");
  });

  /**
   * Guards the case that caused the original leak: a column added to the
   * schema later must be considered explicitly, rather than silently missing
   * from the map and tempting someone back to a bare db.select().
   */
  it("covers every column of admin_users except the password hash", () => {
    const schemaColumns = Object.keys(getTableColumns(adminUsers)).filter(
      (column) => column !== "passwordHash",
    );
    expect(Object.keys(adminUserSafeColumns).sort()).toEqual(schemaColumns.sort());
  });

  it("maps each key to the matching schema column", () => {
    const columns = getTableColumns(adminUsers);
    for (const [key, column] of Object.entries(adminUserSafeColumns)) {
      expect(column).toBe(columns[key as keyof typeof columns]);
    }
  });
});
