import { createTitleSlug } from "api-helpers/common_with_client";

import { WEBSITE_URL } from "../constants";
import type { ContentItem, SSGData } from "../ssg-data";

// Function to generate sitemap.xml
export function generateSitemapXml(routes: string[], ssgData: SSGData): string {
  console.log("routes", routes);

  const currentDate = new Date().toISOString();

  const latestNews = ssgData.news.sort((a, b) => b.publishedAt - a.publishedAt)[0];
  const latestArticle = ssgData.articles.sort((a, b) => b.publishedAt - a.publishedAt)[0];
  const latestPodcast = ssgData.podcasts.sort((a, b) => b.publishedAt - a.publishedAt)[0];

  const allContent: ContentItem[] = [
    ...ssgData.news,
    ...ssgData.articles,
    ...ssgData.podcasts,
  ].sort((a, b) => b.publishedAt - a.publishedAt);

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
      } else if (route.startsWith("/haber/")) {
        // a specific news page
        const [, _route, slug] = route.split("/");

        if (_route !== "haber") {
          throw new Error("Invalid route for news page");
        }

        if (!slug) {
          throw new Error("No slug found for news page");
        }

        const news = ssgData.news.find((n) => createTitleSlug(n.title) === slug);

        if (!news) {
          throw new Error("News not found");
        }

        priority = "0.5";
        changefreq = "monthly";
        lastmod = getLastmod(news);
      } else if (route === "/haberler") {
        // the news page (redirects to latest page)
        priority = "0.9";
        changefreq = "daily";
        lastmod = getLastmod(latestNews);
      } else if (route.startsWith("/haberler/")) {
        // paginated news pages
        const [, _route, page] = route.split("/");

        if (_route !== "haberler") {
          throw new Error("Invalid route for paginated news page");
        }

        if (!page || isNaN(parseInt(page))) {
          throw new Error("Invalid page number for paginated news page");
        }

        const pageNum = parseInt(page);
        const NEWS_PER_PAGE = 10;
        const totalPages = Math.ceil(ssgData.news.length / NEWS_PER_PAGE);

        if (pageNum < 1 || pageNum > totalPages) {
          return []; // Skip invalid pages
        }

        // Get the latest news item for this page
        const sortedNews = ssgData.news.sort((a, b) => a.publishedAt - b.publishedAt);
        const startIndex = (pageNum - 1) * NEWS_PER_PAGE;
        const endIndex = startIndex + NEWS_PER_PAGE;
        const pageNews = sortedNews.slice(startIndex, endIndex);
        const latestNewsOnPage = pageNews[pageNews.length - 1]; // Last item on page

        priority = pageNum === totalPages ? "0.9" : "0.7"; // Latest page gets higher priority
        changefreq = "daily";
        lastmod = latestNewsOnPage ? getLastmod(latestNewsOnPage) : currentDate;
      } else if (route.startsWith("/makale/")) {
        // a specific article page
        const [, _route, slug] = route.split("/");

        if (_route !== "makale") {
          throw new Error("Invalid route for article page");
        }

        if (!slug) {
          throw new Error("No slug found for article page");
        }

        const article = ssgData.articles.find((a) => createTitleSlug(a.title) === slug);

        if (!article) {
          throw new Error("Article not found");
        }

        priority = "0.5";
        changefreq = "weekly";
        lastmod = getLastmod(article);
      } else if (route === "/makaleler") {
        // the articles page
        priority = "0.8";
        changefreq = "daily";
        lastmod = getLastmod(latestArticle);
      } else if (route.startsWith("/podcast/")) {
        // a specific podcast page
        const [, _route, slug] = route.split("/");

        if (_route !== "podcast") {
          throw new Error("Invalid route for podcast page");
        }

        if (!slug) {
          throw new Error("No slug found for podcast page");
        }

        const podcast = ssgData.podcasts.find((p) => createTitleSlug(p.title) === slug);

        if (!podcast) {
          throw new Error("Podcast not found");
        }

        priority = "0.5";
        changefreq = "weekly";
        lastmod = getLastmod(podcast);
      } else if (route === "/podcast") {
        // the podcasts page
        priority = "0.7";
        changefreq = "weekly";
        lastmod = getLastmod(latestPodcast);
      } else if (route === "/son-dakika") {
        // the latest page (redirects to latest page)
        priority = "0.9";
        changefreq = "daily";
        lastmod = getLastmod(latestContent[0]);
      } else if (route.startsWith("/son-dakika/")) {
        // paginated latest pages (mixed content)
        const [, _route, page] = route.split("/");

        if (_route !== "son-dakika") {
          throw new Error("Invalid route for paginated latest page");
        }

        if (!page || isNaN(parseInt(page))) {
          throw new Error("Invalid page number for paginated latest page");
        }

        const pageNum = parseInt(page);
        const ITEMS_PER_PAGE = 10;
        const allItems = [...ssgData.news, ...ssgData.articles, ...ssgData.podcasts];
        const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

        if (pageNum < 1 || pageNum > totalPages) {
          return []; // Skip invalid pages
        }

        // Get the latest content item for this page
        const sortedItems = allItems.sort((a, b) => a.publishedAt - b.publishedAt);
        const startIndex = (pageNum - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageItems = sortedItems.slice(startIndex, endIndex);
        const latestItemOnPage = pageItems[pageItems.length - 1]; // Last item on page

        priority = pageNum === totalPages ? "0.9" : "0.7"; // Latest page gets higher priority
        changefreq = "daily";
        lastmod = latestItemOnPage ? getLastmod(latestItemOnPage) : currentDate;
      } else if (route.startsWith("/etiket/")) {
        // a specific tag page
        const [, _route, slug] = route.split("/");

        if (_route !== "etiket") {
          throw new Error("Invalid route for tag page");
        }

        if (!slug) {
          throw new Error("No slug found for tag page");
        }

        const latestContentByTag = latestContent.find((c) =>
          c.tagItems.some((tagItem) => tagItem.tag === slug),
        );

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
