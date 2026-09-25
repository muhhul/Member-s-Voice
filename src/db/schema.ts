import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["master", "viewer"]);

/**
 * A submitted voice.
 *
 * ANONYMITY REQUIREMENT: this table has no relation to any user, IP address,
 * device or session, and must never gain one. Adding such a column would break
 * the promise the submission form makes to employees.
 */
export const voices = pgTable(
  "voices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Validated against CATEGORIES in application code, stored as text so the
    // list can change without a database migration.
    category: text("category").notNull(),
    message: text("message").notNull(),
    // Full precision is kept for stable sorting only. The UI and the CSV
    // export must show the date alone.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("voices_created_at_idx").on(table.createdAt),
    index("voices_category_idx").on(table.category),
  ],
);

export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("viewer"),
  // Accounts are deactivated, never deleted.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Voice = typeof voices.$inferSelect;
