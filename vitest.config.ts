import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "packages/**/__tests__/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@naijaplay/shared": path.resolve(__dirname, "./packages/shared/src"),
      "@naijaplay/validation": path.resolve(__dirname, "./packages/validation/src"),
      "@naijaplay/permissions": path.resolve(__dirname, "./packages/permissions/src"),
      "@naijaplay/game-engine": path.resolve(__dirname, "./packages/game-engine/src"),
      "@naijaplay/database": path.resolve(__dirname, "./packages/database/src"),
      "@naijaplay/ui": path.resolve(__dirname, "./packages/ui/src"),
    },
  },
});
