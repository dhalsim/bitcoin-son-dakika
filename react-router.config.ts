import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { fetchSSGData, type SSGData } from "./src/lib/ssg-data";

// Type declaration for global SSG data
declare global {
  var __SSG_DATA__: SSGData;
}

export default {
  // Use src directory instead of app
  appDirectory: "src",

  ssr: false,

  presets: [vercelPreset()],

  // Use route discovery for client-side routing
  routeDiscovery: {
    mode: "initial",
  },

  // Enable static pre-rendering for main site (SSG mode)
  async prerender() {
    console.log("Starting prerender with SSG data fetch...");

    try {
      // Fetch the latest news and articles from Nostr relays
      const ssgData = await fetchSSGData();

      // Store the data globally for use in routes
      // This will be available during prerendering
      global.__SSG_DATA__ = ssgData;

      console.log(
        `Prerendering with ${ssgData.news.length} news items and ${ssgData.articles.length} articles`,
      );

      return [
        "/", // Ana sayfa - Bitcoin Son Dakika
        "/admin-panel", // Admin panel - client-side only, publicly accessible
      ];
    } catch (error) {
      console.error("Error during prerender data fetch:", error);

      // Fallback to empty data if fetch fails
      global.__SSG_DATA__ = {
        news: [],
        articles: [],
        lastUpdated: Date.now(),
      };

      return ["/", "/admin-panel"];
    }
  },
} satisfies Config;
