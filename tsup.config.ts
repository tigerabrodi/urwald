import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"], // Most important formats for packages
  dts: true,
  clean: true,
  minify: true,
  outDir: "dist",
});
