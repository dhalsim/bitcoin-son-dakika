import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { generateFeeds } from "./src/lib/feed-generator";
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

  // Use initial route discovery for mixed static/dynamic site
  // Main page (/) is static, admin panel is dynamic
  routeDiscovery: {
    mode: "initial",
  },

  // Enable static pre-rendering for main site (SSG mode)
  async prerender() {
    console.log("Starting prerender with SSG data fetch...");

    // Fetch the latest news and articles from Nostr relays
    const ssgData = await fetchSSGData();

    // Store the data globally for use in routes during prerendering
    global.__SSG_DATA__ = ssgData;

    // Also embed the data in the HTML for client-side access
    if (typeof global !== "undefined") {
      console.log(`ssgData is set to window.__SSG_DATA__ in the client`);

      // Store the data as a string that will be embedded in the HTML
      (global as any).__SSG_DATA_HTML__ = JSON.stringify(ssgData);
    }

    console.log(
      `Prerendering with ${ssgData.news.length} news items and ${ssgData.articles.length} articles`,
    );

    // Generate RSS and Atom feeds
    const { rssFeed, atomFeed } = generateFeeds(ssgData);

    // Write feed files to build directory
    const buildDir = join(process.cwd(), "build", "client");
    const feedDir = join(buildDir, "feed");

    try {
      // Ensure directory exists
      await mkdir(feedDir, { recursive: true });

      // Write files
      await writeFile(join(feedDir, "rss.xml"), rssFeed);
      await writeFile(join(feedDir, "atom.xml"), atomFeed);

      console.log("✅ RSS and Atom feeds generated successfully");
    } catch (error) {
      console.error("❌ Error generating feeds:", error);
    }

    return [
      "/", // Ana sayfa - Bitcoin Son Dakika (static)
      "/news", // Haberler sayfası - static
      "/admin-panel", // Admin panel - dynamic, but needs to be discovered
      "/ssg-debug", // SSG debug page - only available in development
    ];
  },
} satisfies Config;
