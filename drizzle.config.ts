import { config as loadEnv } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Vercel writes pulled variables to .env.local; a plain .env is the fallback.
loadEnv({ path: ".env.local" });
loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Run: vercel env pull .env.local");
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
