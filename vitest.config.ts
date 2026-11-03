import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts", "src/packages/**/__tests__/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@naijaplay/shared": path.resolve(__dirname, "./src/packages/shared/src"),
      "@naijaplay/validation": path.resolve(__dirname, "./src/packages/validation/src"),
      "@naijaplay/permissions": path.resolve(__dirname, "./src/packages/permissions/src"),
      "@naijaplay/game-engine": path.resolve(__dirname, "./src/packages/game-engine/src"),
      "@naijaplay/database": path.resolve(__dirname, "./src/packages/database/src"),
      "@naijaplay/ui": path.resolve(__dirname, "./src/packages/ui/src"),
    },
  },
});
