import type { NostrEvent } from "nostr-tools";
import { SimplePool } from "nostr-tools";

const ADMIN_RELAYS = [
  "wss://relay.nostr.band",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.mom",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nos.social",
];

const MASTER_ADMIN_PUBKEY =
  "5fb571abb0a02ff241fc6090437ef1516157c66e03918ac519befea6475b72df";

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
  const pool = new SimplePool();

  console.log("Fetching SSG data from Nostr relays...");

  // Fetch news and articles sets
  const [newsSetEvent, articlesSetEvent] = await Promise.all([
    pool.get(ADMIN_RELAYS, {
      authors: [MASTER_ADMIN_PUBKEY],
      kinds: [30004],
      "#d": ["news"],
      limit: 1,
    }),
    pool.get(ADMIN_RELAYS, {
      authors: [MASTER_ADMIN_PUBKEY],
      kinds: [30004],
      "#d": ["articles"],
      limit: 1,
    }),
  ]);

  if (newsSetEvent == null) {
    throw new Error("News set event not found");
  }

  if (articlesSetEvent == null) {
    throw new Error("Articles set event not found");
  }

  const newsEventParams = newsSetEvent.tags
    .filter((tag) => tag[0] === "e")
    .map((tag) => ({ id: tag[1], relay: tag[2] }));

  if (newsEventParams.length === 0) {
    throw new Error("News event params not found");
  }

  if (newsEventParams.some((p) => p.id == null || p.relay == null)) {
    throw new Error("News event params are invalid");
  }

  const articlesEventParams = articlesSetEvent.tags
    .filter((tag) => tag[0] === "a")
    .map((tag) => ({ aTag: tag[1], relay: tag[2] }));

  if (articlesEventParams.length === 0) {
    throw new Error("Articles event params not found");
  }

  if (articlesEventParams.some((p) => p.aTag == null || p.relay == null)) {
    throw new Error("Articles event params are invalid");
  }

  const [newsEvents, articlesEvents] = await Promise.all([
    pool.querySync(
      newsEventParams.map((p) => p.relay),
      {
        ids: newsEventParams.map((p) => p.id),
        kinds: [1],
      },
    ),
    pool.querySync(
      articlesEventParams.map((p) => p.relay),
      {
        "#a": articlesEventParams.map((p) => p.aTag),
        kinds: [30023],
      },
    ),
  ]);

  const news: NewsItem[] = newsEvents.map(processNewsEvent);
  const articles: ArticleItem[] = articlesEvents.map(processArticleEvent);

  // Sort by publication date (newest first)
  news.sort((a, b) => b.publishedAt - a.publishedAt);
  articles.sort((a, b) => b.publishedAt - a.publishedAt);

  console.log(
    `Fetched ${news.length} news items and ${articles.length} articles`,
  );

  return {
    news: news.slice(0, 50), // Limit to recent 50 news
    articles: articles.slice(0, 50), // Limit to recent 50 articles
    lastUpdated: Date.now(),
  };
}
