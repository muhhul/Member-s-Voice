import { adminUsers } from "@/db/schema";

/**
 * Every column of admin_users EXCEPT password_hash.
 *
 * SECURITY REQUIREMENT: always select through this map when reading admin
 * accounts for rendering. A bare `db.select().from(adminUsers)` pulls the
 * bcrypt hash along with everything else, and React serialises the data a
 * Server Component renders into the page payload - which puts every account's
 * password hash into HTML that reaches the browser.
 *
 * The one place allowed to read password_hash is the login action, which
 * queries for it explicitly and never passes it into a render.
 */
export const adminUserSafeColumns = {
  id: adminUsers.id,
  email: adminUsers.email,
  name: adminUsers.name,
  role: adminUsers.role,
  isActive: adminUsers.isActive,
  createdAt: adminUsers.createdAt,
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
