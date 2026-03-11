import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["src/__tests__/**/*.test.ts"],
    exclude: ["node_modules", ".expo"],
    testTimeout: 10000,
  },
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
});
