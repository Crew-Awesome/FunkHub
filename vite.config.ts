import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const appVersion = process.env.npm_package_version || "0.0.0";
const buildChannel = process.env.BUILD_CHANNEL
  || process.env.VITE_BUILD_CHANNEL
  || (process.env.GITHUB_ACTIONS ? "nightly" : "release");

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  define: {
    __FUNKHUB_VERSION__: JSON.stringify(appVersion),
    __FUNKHUB_CHANNEL__: JSON.stringify(buildChannel),
  },
});
