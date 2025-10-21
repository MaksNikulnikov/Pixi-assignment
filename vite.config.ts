import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: { host: true },
  resolve: {
    alias: {
      "@core": resolve(__dirname, "src/core"),
      "@scenes": resolve(__dirname, "src/scenes"),
      "@ui": resolve(__dirname, "src/ui"),
      "@config": resolve(__dirname, "src/config"),
      "@services": resolve(__dirname, "src/services"),
      "@cards": resolve(__dirname, "src/cards"),
    },
  },
  build: {
    sourcemap: true,
  },
});
