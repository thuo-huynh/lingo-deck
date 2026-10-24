import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "src/test/empty.ts") } },
  test: { environment: "node", include: ["src/**/*.test.ts"], exclude: ["e2e/**", "node_modules/**"], testTimeout: 60_000, hookTimeout: 120_000 },
});
