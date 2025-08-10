import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { createTitleSlug } from "./api-helpers/utils";
import { generateFeeds } from "./src/lib/feed-generator";
import {
  fetchSSGData,
  type SSGData,
  getUniqueProfiles,
  createProfileSlug,
  getUniqueTags,
} from "./src/lib/ssg-data";

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

    // Generate profile routes for all unique profiles
    const profiles = getUniqueProfiles(ssgData);
    const profileRoutes = profiles
      .filter((profile) => profile.display_name)
      .map((profile) => `/profile/${createProfileSlug(profile.display_name!)}`);

    console.log(`Generated ${profileRoutes.length} profile routes`);

    // Generate tag routes for all unique tags
    const tags = getUniqueTags(ssgData);
    const tagRoutes = tags.map((tag) => `/tag/${tag}`);

    console.log(`Generated ${tagRoutes.length} tag routes`);

    // Generate news routes for all unique news
    const articlesRoutes = ssgData.articles
      .filter((n): n is typeof n & { title: string } => !!n.title && !!n.summary)
      .map((n) => `/article/${createTitleSlug(n.title)}`);

    console.log(`Generated ${articlesRoutes.length} article routes`);

    const newsRoutes = ssgData.news
      .filter((n): n is typeof n & { title: string } => !!n.title && !!n.summary)
      .map((n) => `/news/${createTitleSlug(n.title)}`);

    console.log(`Generated ${newsRoutes.length} news routes`);

    return [
      "/", // Ana sayfa - Bitcoin Son Dakika (static)
      "/admin-panel", // Admin paneli - static
      "/news", // Haberler sayfası - static
      "/articles", // Makaleler sayfası - static
      "/son-dakika", // Son dakika sayfası - static
      ...profileRoutes, // Profile pages - static
      ...tagRoutes, // Tag pages - static
      ...articlesRoutes, // Article detail pages - static
      ...newsRoutes, // News detail pages - static
    ];
  },
} satisfies Config;
