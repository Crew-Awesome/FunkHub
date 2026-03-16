import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const sourceVersion = process.env.VITE_APP_VERSION
  || process.env.BUILD_VERSION
  || process.env.npm_package_version
  || "0.0.0";
const appVersion = sourceVersion.trim().replace(/^v/i, "") || "0.0.0";
const isTagBuild = process.env.GITHUB_REF_TYPE === "tag"
  || /^refs\/tags\//i.test(process.env.GITHUB_REF || "");
const buildChannel = process.env.BUILD_CHANNEL
  || process.env.VITE_BUILD_CHANNEL
  || (process.env.GITHUB_ACTIONS ? (isTagBuild ? "release" : "nightly") : "release");

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  define: {
    __FUNKHUB_VERSION__: JSON.stringify(appVersion),
    __FUNKHUB_CHANNEL__: JSON.stringify(buildChannel),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router"],
          "vendor-motion": ["motion"],
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-checkbox", "sonner"],
        },
      },
    },
  },
});
