import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

let instance: Database | null = null;

function connect(): Database {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    instance = drizzle(neon(url), { schema });
  }
  return instance;
}

/**
 * The connection is built on the first query, not when this module is imported.
 *
 * Connecting at import time coupled three unrelated things to a live secret:
 * `next build` could not compile without DATABASE_URL, any script that imported
 * a module in this graph exploded before its own dotenv call could run, and the
 * query layer could not be unit tested at all. Deferring the lookup removes all
 * three. A missing DATABASE_URL still fails loudly - just at the first query,
 * where the message is actionable, rather than at import.
 */
export const db = new Proxy({} as Database, {
  get(_target, property) {
    const real = connect();
    const value = Reflect.get(real, property) as unknown;
    // Methods must keep their original `this`, or drizzle's builder breaks.
    return typeof value === "function" ? value.bind(real) : value;
  },
});
