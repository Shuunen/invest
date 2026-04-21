import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    // oxlint-disable-next-line new-cap
    VitePWA({
      manifest: {
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          { sizes: "192x192", src: "/icon-192.png", type: "image/png" },
          { sizes: "512x512", src: "/icon-512.png", type: "image/png" },
        ],
        name: "Invest — Portfolio Tracker",
        short_name: "Invest",
        theme_color: "#1d4ed8",
      },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            handler: "NetworkFirst",
            urlPattern: /^https:\/\//,
          },
        ],
      },
    }),
  ],
  test: {
    environment: "happy-dom",
    exclude: ["e2e/**", "node_modules/**"],
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
