import { createTitleSlug } from "api-helpers/utils";

import { WEBSITE_URL } from "../constants";
import type { ContentItem, SSGData } from "../ssg-data";

// Function to generate sitemap.xml
export function generateSitemapXml(routes: string[], ssgData: SSGData): string {
  console.log("routes", routes);

  const currentDate = new Date().toISOString();

  const latestNews = ssgData.news.sort((a, b) => b.publishedAt - a.publishedAt)[0];
  const latestArticle = ssgData.articles.sort((a, b) => b.publishedAt - a.publishedAt)[0];
  const latestPodcast = ssgData.podcasts.sort((a, b) => b.publishedAt - a.publishedAt)[0];

  const allContent = [...ssgData.news, ...ssgData.articles, ...ssgData.podcasts].sort(
    (a, b) => b.publishedAt - a.publishedAt,
  );
  const latestContent = allContent.sort((a, b) => b.publishedAt - a.publishedAt);

  const getLastmod = (content: ContentItem) => {
    return content.publishedAt ? new Date(content.publishedAt * 1000).toISOString() : currentDate;
  };

  const sitemapEntries = routes
    .map((route) => {
      // Set different priorities and change frequencies based on route type
      let priority = "0.5";
      let changefreq = "weekly";
      let lastmod = currentDate;

      if (route === "/") {
        priority = "1.0";
        changefreq = "daily";
      } else if (route.startsWith("/news/")) {
        // a specific news page
        const [, _route, slug] = route.split("/");

        if (!slug) {
          return [];
        }

        const news = ssgData.news.find((n) => createTitleSlug(n.title) === slug);

        if (!news) {
          return [];
        }

        priority = "0.5";
        changefreq = "monthly";
        lastmod = getLastmod(news);
      } else if (route === "/news") {
        // the news page
        priority = "0.9";
        changefreq = "daily";
        lastmod = getLastmod(latestNews);
      } else if (route.startsWith("/article/")) {
        // a specific article page
        const [, _route, slug] = route.split("/");

        if (!slug) {
          return [];
        }

        const article = ssgData.articles.find((a) => createTitleSlug(a.title) === slug);

        if (!article) {
          return [];
        }

        priority = "0.5";
        changefreq = "weekly";
        lastmod = getLastmod(article);
      } else if (route === "/articles") {
        // the articles page
        priority = "0.8";
        changefreq = "daily";
        lastmod = getLastmod(latestArticle);
      } else if (route.startsWith("/podcast/")) {
        // a specific podcast page
        const [, _route, slug] = route.split("/");

        if (!slug) {
          return [];
        }

        const podcast = ssgData.podcasts.find((p) => createTitleSlug(p.title) === slug);

        if (!podcast) {
          return [];
        }

        priority = "0.5";
        changefreq = "weekly";
        lastmod = getLastmod(podcast);
      } else if (route === "/podcasts") {
        // the podcasts page
        priority = "0.7";
        changefreq = "weekly";
        lastmod = getLastmod(latestPodcast);
      } else if (route.startsWith("/tag/")) {
        // a specific tag page
        const [, _route, slug] = route.split("/");

        if (!slug) {
          return [];
        }

        const latestContentByTag = latestContent.find((c) => c.tags.includes(slug));

        if (!latestContentByTag) {
          return [];
        }

        priority = "0.6";
        changefreq = "daily";
        lastmod = getLastmod(latestContentByTag);
      } else {
        return [];
      }

      return [
        `<url>
    <loc>${WEBSITE_URL}${route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`,
      ];
    })
    .flat()
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</urlset>`;
}
