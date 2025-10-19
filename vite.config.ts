import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: { host: true },
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
      "@scenes": resolve(__dirname, "src/scenes"),
      "@ui": resolve(__dirname, "src/ui"),
    },
  },
  build: {
    sourcemap: true,
  },
});
