import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [tailwindcss(), crx({ manifest })],
  server: {
    cors: {
      origin: [/chrome-extension:\/\//],
    },
  },
});
