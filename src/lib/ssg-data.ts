import type { NostrEvent } from "nostr-tools";

import { fetchNostrSets, pool } from "../../api/utils";

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  publishedAt: number;
  author: {
    pubkey: string;
    name?: string;
    picture?: string;
  };
  tags: string[];
  category?: string;
  relay?: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  publishedAt: number;
  author: {
    pubkey: string;
    name?: string;
    picture?: string;
  };
  tags: string[];
  category?: string;
  relay?: string;
  identifier?: string;
}

export interface SSGData {
  news: NewsItem[];
  articles: ArticleItem[];
  lastUpdated: number;
}

function processNewsEvent(event: NostrEvent): NewsItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const categoryTag = event.tags.find((tag) => tag[0] === "t");

  return {
    id: event.id,
    title: titleTag?.[1] || "Untitled",
    content: event.content,
    summary: summaryTag?.[1],
    publishedAt: event.created_at,
    author: {
      pubkey: event.pubkey,
    },
    tags: event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]),
    category: categoryTag?.[1],
  };
}

function processArticleEvent(event: NostrEvent): ArticleItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const categoryTag = event.tags.find((tag) => tag[0] === "t");
  const dTag = event.tags.find((tag) => tag[0] === "d");

  return {
    id: event.id,
    title: titleTag?.[1] || "Untitled Article",
    content: event.content,
    summary: summaryTag?.[1],
    publishedAt: event.created_at,
    author: {
      pubkey: event.pubkey,
    },
    tags: event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]),
    category: categoryTag?.[1],
    identifier: dTag?.[1],
  };
}

export async function fetchSSGData(): Promise<SSGData> {
  console.log("Fetching SSG data from Nostr relays...");

  const { news: newsTags, articles: articleTags } = await fetchNostrSets([
    "news",
    "articles",
  ]);

  if (newsTags.length === 0) {
    throw new Error("News tags not found");
  }

  if (articleTags.length === 0) {
    throw new Error("Article tags not found");
  }

  const newsRelays = newsTags.map((tag) => tag.relay);
  const articleRelays = articleTags.map((tag) => tag.relay);

  const [newsEvents, articlesEvents] = await Promise.all([
    pool.querySync(newsRelays, {
      ids: newsTags.map((tag) => tag.eTag),
      kinds: [1],
    }),
    pool.querySync(articleRelays, {
      "#a": articleTags.map((tag) => tag.aTag),
      kinds: [30023],
    }),
  ]);

  const newsItems: NewsItem[] = newsEvents.map(processNewsEvent);
  const articleItems: ArticleItem[] = articlesEvents.map(processArticleEvent);

  // Sort by publication date (newest first)
  newsItems.sort((a, b) => b.publishedAt - a.publishedAt);
  articleItems.sort((a, b) => b.publishedAt - a.publishedAt);

  console.log(
    `Fetched ${newsItems.length} news items and ${articleItems.length} articles`,
  );

  return {
    news: newsItems.slice(0, 50), // Limit to recent 50 news
    articles: articleItems.slice(0, 50), // Limit to recent 50 articles
    lastUpdated: Date.now(),
  };
}
