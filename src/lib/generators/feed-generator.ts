import { createTitleSlug } from "api-helpers/utils";

import { WEBSITE_URL, WEBSITE_NAME, WEBSITE_DESCRIPTION, LOGO_URL } from "../constants";
import type { ContentItem, SSGData } from "../ssg-data";
import { formatRssDate, formatAtomDate, links, assertUnreachable } from "../utils";

const prefix = (item: ContentItem) => {
  switch (item.type) {
    case "article":
      return "Makale - ";
    case "news":
      return "Haber - ";
    case "podcast":
      return "Podcast - ";
    default:
      assertUnreachable(item);
  }
};

const urlPostfix = (item: ContentItem, slug: string) => {
  switch (item.type) {
    case "article":
      return `${WEBSITE_URL}${links.articleDetail(slug)}`;
    case "news":
      return `${WEBSITE_URL}${links.newsDetail(slug)}`;
    case "podcast":
      return `${WEBSITE_URL}${links.podcastDetail(slug)}`;
    default:
      assertUnreachable(item);
  }
};

export function generateRSSFeed(ssgData: SSGData): string {
  // Combine and sort news and articles by publish date
  const allContent: ContentItem[] = [
    ...ssgData.news,
    ...ssgData.articles,
    ...ssgData.podcasts,
  ].sort((a, b) => b.publishedAt - a.publishedAt);

  // Generate RSS XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${WEBSITE_NAME}</title>
    <link>${WEBSITE_URL}</link>
    <description>${WEBSITE_DESCRIPTION}</description>
    <language>tr</language>
    <lastBuildDate>${new Date(ssgData.lastUpdated).toUTCString()}</lastBuildDate>
    <atom:link href="${WEBSITE_URL}/feed/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${WEBSITE_URL}/${LOGO_URL}</url>
      <title>${WEBSITE_NAME}</title>
      <link>${WEBSITE_URL}</link>
    </image>
    ${allContent
      .map((item) => {
        const title = `${prefix(item)}${item.title}`;
        const slug = createTitleSlug(item.title);
        const url = `${WEBSITE_URL}${urlPostfix(item, slug)}`;

        return `
    <item>
      <title><![CDATA[${title}]]></title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${formatRssDate(item.publishedAt)}</pubDate>
      <description><![CDATA[${item.summary || item.content.substring(0, 300) + "..."}]]></description>
      <author>${item.author.display_name || item.author.pubkey}</author>
      <category>${item.tags && item.tags.length > 0 ? item.tags[0] : "Bitcoin"}</category>
      ${item.image ? `<enclosure url="${item.image}" type="image/jpeg" />` : ""}
    </item>`;
      })
      .join("")}
  </channel>
</rss>`;
}

export function generateAtomFeed(ssgData: SSGData): string {
  // Combine and sort news and articles by publish date
  const allContent: ContentItem[] = [
    ...ssgData.news,
    ...ssgData.articles,
    ...ssgData.podcasts,
  ].sort((a, b) => b.publishedAt - a.publishedAt);

  // Generate Atom XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${WEBSITE_NAME}</title>
  <link href="${WEBSITE_URL}" />
  <link href="${WEBSITE_URL}/feed/atom.xml" rel="self" type="application/atom+xml" />
  <id>${WEBSITE_URL}/</id>
  <updated>${new Date(ssgData.lastUpdated).toISOString()}</updated>
  <subtitle>${WEBSITE_DESCRIPTION}</subtitle>
  <icon>${WEBSITE_URL}/${LOGO_URL}</icon>
  <logo>${WEBSITE_URL}/${LOGO_URL}</logo>
  ${allContent
    .map((item) => {
      const title = `${prefix(item)}${item.title}`;
      const slug = createTitleSlug(item.title);
      const url = `${WEBSITE_URL}${urlPostfix(item, slug)}`;

      return `
  <entry>
    <title>${title}</title>
    <link href="${url}" />
    <id>${url}</id>
    <updated>${formatAtomDate(item.publishedAt)}</updated>
    <published>${formatAtomDate(item.publishedAt)}</published>
    <summary type="html">${item.summary || item.content.substring(0, 300) + "..."}</summary>
    <author>
      <name>${item.author.display_name || item.author.pubkey}</name>
      ${item.author.picture ? `<uri>${item.author.picture}</uri>` : ""}
    </author>
    <category term="${item.tags && item.tags.length > 0 ? item.tags[0] : "Bitcoin"}" />
    ${item.image ? `<link rel="enclosure" href="${item.image}" type="image/jpeg" />` : ""}
  </entry>`;
    })
    .join("")}
</feed>`;
}

export function generateFeeds(ssgData: SSGData) {
  return {
    rssFeed: generateRSSFeed(ssgData),
    atomFeed: generateAtomFeed(ssgData),
  };
}
