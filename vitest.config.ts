import { defineConfig } from "vitest/config"

export default defineConfig({
  define: { __SDK_VERSION__: JSON.stringify("0.0.0-test") },
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/globals.d.ts"],
      reporter: ["text", "lcov"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
})
