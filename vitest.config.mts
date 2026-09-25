import { defineConfig } from "vitest/config";

export default defineConfig({
  // Vite 7 resolves the "@/*" alias from tsconfig.json natively, so the
  // vite-tsconfig-paths plugin is no longer needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
