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

  ssr: true, // Enable SSR for proper SSG

  presets: [vercelPreset()],

  // Use initial route discovery for mixed static/dynamic site
  // Main page (/) is static, admin panel is dynamic
  routeDiscovery: {
    mode: "initial",
  },

  // Enable static pre-rendering for main site (SSG mode)
  async prerender() {
    console.log("Starting prerender with SSG data fetch...");

    try {
      // Fetch the latest news and articles from Nostr relays
      const ssgData = await fetchSSGData();

      // Store the data globally for use in routes during prerendering
      global.__SSG_DATA__ = ssgData;

      // Also embed the data in the HTML for client-side access
      if (typeof global !== "undefined") {
        (global as any).__SSG_DATA_HTML__ = `
          <script>
            window.__SSG_DATA__ = ${JSON.stringify(ssgData)};
          </script>
        `;
      }

      console.log(
        `Prerendering with ${ssgData.news.length} news items and ${ssgData.articles.length} articles`,
      );

      return [
        "/", // Ana sayfa - Bitcoin Son Dakika (static)
        "/admin-panel", // Admin panel - dynamic, but needs to be discovered
      ];
    } catch (error) {
      console.error("Error during prerender data fetch:", error);

      // Fallback to empty data if fetch fails
      const fallbackData = {
        news: [],
        articles: [],
        lastUpdated: Date.now(), // Use actual build time for SSG
      };

      global.__SSG_DATA__ = fallbackData;

      // Also embed the fallback data in the HTML for client-side access
      if (typeof global !== "undefined") {
        (global as any).__SSG_DATA_HTML__ = `
          <script>
            window.__SSG_DATA__ = ${JSON.stringify(fallbackData)};
          </script>
        `;
      }

      return ["/", "/admin-panel"]; // Include admin panel in discovery
    }
  },
} satisfies Config;
