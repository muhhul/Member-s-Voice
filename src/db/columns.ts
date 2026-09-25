import { adminUsers } from "@/db/schema";

/**
 * Every column of admin_users EXCEPT password_hash.
 *
 * SECURITY REQUIREMENT: always select through this map when reading admin
 * accounts for rendering. A bare `db.select().from(adminUsers)` pulls the
 * bcrypt hash along with everything else, and React serialises the data a
 * Server Component renders into the page payload - which puts the hash into
 * HTML that reaches the browser.
 *
 * tests/no-bare-select.test.ts enforces that no source file selects from
 * adminUsers without naming its columns.
 */
export const adminUserSafeColumns = {
  id: adminUsers.id,
  email: adminUsers.email,
  name: adminUsers.name,
  role: adminUsers.role,
  isActive: adminUsers.isActive,
  createdAt: adminUsers.createdAt,
} as const;

/**
 * The safe columns plus password_hash.
 *
 * FOR PASSWORD VERIFICATION ONLY. The single legitimate reader is the login
 * action, which compares the hash and discards it. A value selected through
 * this map must never be returned from a Server Component, passed to a client
 * component, or stored in a variable that outlives the comparison.
 *
 * tests/no-bare-select.test.ts asserts that exactly one module imports it.
 */
export const adminUserCredentialColumns = {
  ...adminUserSafeColumns,
  passwordHash: adminUsers.passwordHash,
} as const;

/** An admin account as the UI and the authorization layer see it. */
export type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
  role: "master" | "viewer";
  isActive: boolean;
  createdAt: Date;
};
