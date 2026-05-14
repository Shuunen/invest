import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

// oxlint-disable-next-line import/no-default-export
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 500,
    reportCompressedSize: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "react",
              test: /react/u,
            },
          ],
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
    // oxlint-disable-next-line new-cap
    VitePWA({
      manifest: {
        background_color: "#ffffff",
        description: "Offline-first, local-persistence investment portfolio manager",
        display: "standalone",
        icons: [
          { sizes: "192x192", src: "/icon-192.png", type: "image/png" },
          {
            purpose: "any maskable",
            sizes: "192x192",
            src: "/icon-192.png",
            type: "image/png",
          },
          { sizes: "512x512", src: "/icon-512.png", type: "image/png" },
          {
            purpose: "any maskable",
            sizes: "512x512",
            src: "/icon-512.png",
            type: "image/png",
          },
        ],
        id: "/",
        name: "Invest - Your Portfolio Tracker",
        orientation: "portrait-primary",
        scope: "/",
        short_name: "Invest",
        start_url: "/",
        theme_color: "#0069a8",
      },
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            handler: "NetworkFirst",
            urlPattern: /^https:\/\//u,
          },
        ],
      },
    }),
  ],
  test: {
    coverage: {
      exclude: ["src/bin/**/*", "src/pwa.ts", "src/*.tsx", "src/components/animations/**/*"],
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["lcov"],
      thresholds: {
        100: true,
      },
    },
    environment: "happy-dom",
    exclude: ["e2e/**", "node_modules/**"],
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    reporters: ["minimal"],
    restoreMocks: true,
    setupFiles: ["./src/test/setup.ts"],
    silent: true,
    unstubGlobals: true,
  },
});
