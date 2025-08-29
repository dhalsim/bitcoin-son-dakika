import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { createTitleSlug } from "./api-helpers/utils";
import { generateFeeds } from "./src/lib/generators/feed-generator";
import { generatePodcastRssXml } from "./src/lib/generators/podcast-generator";
import { generateSitemapXml } from "./src/lib/generators/sitemap-generator";
import {
  getUniqueProfiles,
  getUniqueTags,
  createProfileSlug,
  fetchSSGData,
} from "./src/lib/ssg-data";
import { links } from "./src/lib/utils";

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
      `Prerendering with ${ssgData.news.length} news items, ${ssgData.articles.length} articles, and ${ssgData.podcasts.length} podcasts`,
    );

    // Generate RSS and Atom feeds
    const { rssFeed, atomFeed } = generateFeeds(ssgData);

    // Generate Podcast RSS feed
    const podcastRssFeed = await generatePodcastRssXml(ssgData.podcasts);

    // Write feed files to build directory
    const buildDir = join(process.cwd(), "build", "client");
    const feedDir = join(buildDir, "feed");

    try {
      // Ensure directory exists
      await mkdir(feedDir, { recursive: true });

      // Write files
      await writeFile(join(feedDir, "rss.xml"), rssFeed);
      await writeFile(join(feedDir, "atom.xml"), atomFeed);
      await writeFile(join(feedDir, "podcast-rss.xml"), podcastRssFeed);

      console.log("✅ RSS, Atom, and Podcast RSS feeds generated successfully");
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
    const tagRoutes = tags.map((tag) => `/tag/${createTitleSlug(tag)}`);

    console.log(`Generated ${tagRoutes.length} tag routes`);

    // Generate news routes for all unique news
    const articlesRoutes = ssgData.articles
      .filter((n): n is typeof n & { title: string } => !!n.title && !!n.summary)
      .map((n) => links.articleDetail(createTitleSlug(n.title)));

    console.log(`Generated ${articlesRoutes.length} article routes`);

    const newsRoutes = ssgData.news
      .filter((n): n is typeof n & { title: string } => !!n.title && !!n.summary)
      .map((n) => `/haber/${createTitleSlug(n.title)}`);

    console.log(`Generated ${newsRoutes.length} news routes`);

    const podcastRoutes = ssgData.podcasts
      .filter((p): p is typeof p & { title: string } => !!p.title && !!p.summary)
      .map((p) => `/podcast/${createTitleSlug(p.title)}`);

    console.log(`Generated ${podcastRoutes.length} podcast routes`);

    const allRoutes = [
      "/", // Ana sayfa - Bitcoin Son Dakika (static)
      "/admin", // Admin paneli - static
      "/haberler", // Haberler sayfası - static
      "/makaleler", // Makaleler sayfası - static
      "/podcast", // Podcast ana sayfası - static
      "/son-dakika", // Son dakika sayfası - static
      ...profileRoutes, // Profile pages - static
      ...tagRoutes, // Tag pages - static
      ...articlesRoutes, // Article detail pages - static
      ...newsRoutes, // News detail pages - static
      ...podcastRoutes, // Podcast detail pages - static
    ];

    // Generate and write sitemap.xml
    console.log("Generating sitemap.xml...");
    const sitemapXml = generateSitemapXml(allRoutes, ssgData);

    await writeFile(join(buildDir, "sitemap.xml"), sitemapXml);

    console.log("✅ Sitemap.xml generated successfully");

    return allRoutes;
  },
} satisfies Config;
