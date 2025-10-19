import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

import { createTitleSlug } from "./api-helpers/common_with_client";
import { generateFeeds } from "./src/lib/generators/feed-generator";
import { generatePodcastRssXml } from "./src/lib/generators/podcast-generator";
import { generateSitemapXml } from "./src/lib/generators/sitemap-generator";
import type { SSGData } from "./src/lib/ssg-data";
import {
  getUniqueAuthors,
  getUniqueTags,
  createAuthorSlug,
  fetchSSGData,
} from "./src/lib/ssg-data";
import { links } from "./src/lib/utils";

// Generate JSON feed for email campaigns - export raw SSG data
function generateJsonFeed(ssgData: SSGData): string {
  return JSON.stringify(ssgData, null, 2);
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

    let ssgData: SSGData;

    if (global.__SSG_DATA__) {
      console.log("SSG data already exists in global");

      ssgData = global.__SSG_DATA__;
    } else {
      console.log("SSG data does not exist in global, fetching from Nostr relays");

      ssgData = await fetchSSGData();

      global.__SSG_DATA__ = ssgData;
      global.__SSG_DATA_HTML__ = JSON.stringify(ssgData);
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

      // Generate JSON feed for email campaigns
      const jsonFeed = generateJsonFeed(ssgData);

      // Write files
      await writeFile(join(feedDir, "rss.xml"), rssFeed);
      await writeFile(join(feedDir, "atom.xml"), atomFeed);
      await writeFile(join(feedDir, "podcast-rss.xml"), podcastRssFeed);
      await writeFile(join(feedDir, "email-data.json"), jsonFeed);

      console.log("✅ RSS, Atom, Podcast RSS, and JSON feeds generated successfully");
    } catch (error) {
      console.error("❌ Error generating feeds:", error);
    }

    // Generate profile routes for all unique profiles
    const authors = getUniqueAuthors(ssgData);
    const authorRoutes = authors
      .filter((profile) => profile.display_name)
      .map((profile) => links.author(createAuthorSlug(profile.display_name!)));

    console.log(`Generated ${authorRoutes.length} author routes`);

    // Generate tag routes for all unique tags
    const tags = getUniqueTags(ssgData);
    const tagRoutes = [
      ...new Set(
        tags.flatMap((tagItem) => [
          links.tag(tagItem.tag),
          links.tag(createTitleSlug(tagItem.tag)),
        ]),
      ),
    ];

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
      .flatMap((p) => {
        const slug = createTitleSlug(p.title);

        return [`/podcast/${slug}`, `/podcast-player/${slug}`];
      });

    console.log(`Generated ${podcastRoutes.length} podcast routes`);

    // Generate paginated news routes
    const NEWS_PER_PAGE = 10;
    const newsTotalPages = Math.ceil(ssgData.news.length / NEWS_PER_PAGE);
    const newsPageRoutes = Array.from({ length: newsTotalPages }, (_, i) => `/haberler/${i + 1}`);

    // Generate paginated latest routes (mixed content)
    const ITEMS_PER_PAGE = 10;
    const allItems = [...ssgData.news, ...ssgData.articles, ...ssgData.podcasts];
    const latestTotalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
    const latestPageRoutes = Array.from(
      { length: latestTotalPages },
      (_, i) => `/son-dakika/${i + 1}`,
    );

    console.log(`Generated ${newsPageRoutes.length} paginated news routes`);
    console.log(`Generated ${latestPageRoutes.length} paginated latest routes`);

    const allRoutes = [
      "/", // Ana sayfa - Bitcoin Son Dakika (static)
      "/admin", // Admin paneli
      "/profile", // Profil
      "/haberler", // Haberler sayfası - redirects to latest page
      "/makaleler", // Makaleler sayfası - static
      "/podcast", // Podcast ana sayfası - static
      "/son-dakika", // Son dakika sayfası - redirects to latest page
      ...newsPageRoutes.sort(), // Paginated news pages - static
      ...latestPageRoutes.sort(), // Paginated latest pages - static
      ...authorRoutes.sort(), // Profile pages - static
      ...tagRoutes.sort(), // Tag pages - static
      ...articlesRoutes.sort(), // Article detail pages - static
      ...newsRoutes.sort(), // News detail pages - static
      ...podcastRoutes.sort(), // Podcast detail pages - static
    ];

    // Generate and write sitemap.xml
    console.log("Generating sitemap.xml...");
    const sitemapXml = generateSitemapXml(allRoutes, ssgData);

    await writeFile(join(buildDir, "sitemap.xml"), sitemapXml);

    console.log("✅ Sitemap.xml generated successfully");

    return [...allRoutes, "/unsubscribe"];
  },
} satisfies Config;
