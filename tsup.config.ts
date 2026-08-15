import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src", "!src/generated"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
});
