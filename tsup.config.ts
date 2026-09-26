import { defineConfig } from "tsup"
import pkg from "./package.json" with { type: "json" }

export default defineConfig({
  entry: { index: "src/index.ts", next: "src/next.ts", seo: "src/seo.ts" },
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  external: ["next", "next/cache"],
  define: { __SDK_VERSION__: JSON.stringify(pkg.version) },
})
