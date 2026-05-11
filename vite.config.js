import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  server: {
    proxy: {
      "/api/youtube": {
        target: "https://www.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api\/youtube/, "/youtube/v3");
          const url = new URL(newPath, "https://www.googleapis.com");
          url.searchParams.set("key", process.env.VITE_YOUTUBE_API_KEY);
          return url.pathname + url.search;
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Stream Watchlist",
        short_name: "Watchlist",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa-192x192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-512x512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
          },
        ],
      },
    }),
  ],
});