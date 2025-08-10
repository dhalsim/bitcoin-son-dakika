import { fetchNostrSets, pool } from "../../api-helpers/utils";

import type { EventItem, ProfileItem } from "./nip01";
import { getProfiles } from "./nip01";

export interface NewsItem {
  id: string;
  content: string;
  event: EventItem;
  author: ProfileItem;
  publishedAt: number;
  tags: string[];
  title?: string;
  summary?: string;
  image?: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  event: EventItem;
  author: ProfileItem;
  publishedAt: number;
  summary?: string;
  identifier?: string;
  image?: string;
}

export interface SSGData {
  news: NewsItem[];
  articles: ArticleItem[];
  lastUpdated: number;
}

function processNewsEvent(event: EventItem, author: ProfileItem): NewsItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const imageTag = event.tags.find((tag) => tag[0] === "image");

  return {
    id: event.id,
    title: titleTag?.[1],
    content: event.content,
    event,
    summary: summaryTag?.[1],
    publishedAt: event.created_at,
    author,
    tags: event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]),
    image: imageTag?.[1],
  };
}

function processArticleEvent(event: EventItem, author: ProfileItem): ArticleItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const dTag = event.tags.find((tag) => tag[0] === "d");
  const imageTag = event.tags.find((tag) => tag[0] === "image");

  return {
    id: event.id,
    title: titleTag?.[1],
    content: event.content,
    event,
    summary: summaryTag?.[1],
    publishedAt: event.created_at,
    author,
    tags: event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]),
    identifier: dTag?.[1],
    image: imageTag?.[1],
  };
}

export async function fetchSSGData(): Promise<SSGData> {
  console.log("Fetching SSG data from Nostr relays...");

  const { newsTags, articleTags } = await fetchNostrSets(["news", "articles"]);

  if (newsTags.length === 0) {
    throw new Error("News tags not found");
  }

  if (articleTags.length === 0) {
    throw new Error("Article tags not found");
  }

  const newsRelays = newsTags.map((tag) => tag.relay);
  const articleResults = articleTags.map((tag) => {
    const [_kind, pubkey, dTag] = tag.aTag.split(":");

    return {
      dTag,
      pubkey,
      relay: tag.relay,
    };
  });

  const [newsEvents, articlesEvents] = await Promise.all([
    pool.querySync(newsRelays, {
      ids: newsTags.map((tag) => tag.eTag),
      kinds: [1],
    }),
    pool.querySync(
      articleResults.map((result) => result.relay),
      {
        "#d": articleResults.map((result) => result.dTag),
        authors: articleResults.map((result) => result.pubkey),
        kinds: [30023],
      },
    ),
  ]);

  const profilePubkeys = new Set([...newsEvents, ...articlesEvents].map((item) => item.pubkey));

  const profileEvents = await getProfileEvents(Array.from(profilePubkeys));

  const newsItems: NewsItem[] = newsEvents.map((ne) => {
    const profile = profileEvents.get(ne.pubkey);

    if (!profile) {
      throw new Error(`Author not found or profile can't be parsed: ${ne.pubkey}`);
    }

    const relayHintTag = newsTags.find((tag) => tag.eTag === ne.id);

    if (!relayHintTag) {
      throw new Error(`Relay hint not found: ${ne.id}`);
    }

    return processNewsEvent({ ...ne, relay: relayHintTag.relay }, profile);
  });

  const articleItems: ArticleItem[] = articlesEvents.map((ae) => {
    const profile = profileEvents.get(ae.pubkey);

    if (!profile) {
      throw new Error(`Author not found or profile can't be parsed: ${ae.pubkey}`);
    }

    const dTag = ae.tags.find((tag) => tag[0] === "d");

    if (!dTag) {
      throw new Error(`D tag not found: ${ae.id}`);
    }

    const aTag = `30023:${ae.pubkey}:${dTag[1]}`;

    const relayHintTag = articleTags.find((tag) => tag.aTag === aTag);

    if (!relayHintTag) {
      throw new Error(`Relay hint not found: ${ae.id}`);
    }

    return processArticleEvent({ ...ae, relay: relayHintTag.relay }, profile);
  });

  // Sort by publication date (newest first)
  newsItems.sort((a, b) => b.publishedAt - a.publishedAt);
  articleItems.sort((a, b) => b.publishedAt - a.publishedAt);

  console.log(`Fetched ${newsItems.length} news items and ${articleItems.length} articles`);

  return {
    news: newsItems,
    articles: articleItems,
    lastUpdated: Date.now(), // Use actual build time for SSG
  };
}

export function getProfileEvents(profilePubkeys: string[]): Promise<Map<string, ProfileItem>> {
  return new Promise((resolve) => {
    getProfiles({
      authors: profilePubkeys,
      cachedProfiles: new Map(),
      onUpdate: resolve,
    });
  });
}

export function getUniqueTags(ssgData: SSGData): string[] {
  const tagSet = new Set<string>();

  ssgData.news.forEach((item) => {
    item.tags.forEach((tag) => tagSet.add(tag));
  });

  ssgData.articles.forEach((item) => {
    item.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet);
}

// Helper function to get unique profiles from SSG data
export function getUniqueProfiles(ssgData: SSGData): ProfileItem[] {
  const profileMap = new Map<string, ProfileItem>();

  // Collect profiles from news
  ssgData.news.forEach((item) => {
    if (getDisplayName(item.author, item.author.pubkey)) {
      profileMap.set(item.author.pubkey, item.author);
    }
  });

  // Collect profiles from articles
  ssgData.articles.forEach((item) => {
    if (getDisplayName(item.author, item.author.pubkey)) {
      profileMap.set(item.author.pubkey, item.author);
    }
  });

  return Array.from(profileMap.values());
}

// Helper function to create profile slug from display name
export function createProfileSlug(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim();
}

export function getDisplayName(profile: ProfileItem, pubkey: string) {
  return profile.display_name || profile.name || `${pubkey.slice(0, 8)}...`;
}

// Helper function to find profile by slug
export function findProfileBySlug(ssgData: SSGData, slug: string): ProfileItem | undefined {
  const profiles = getUniqueProfiles(ssgData);

  return profiles.find(
    (profile) => createProfileSlug(getDisplayName(profile, profile.pubkey)) === slug,
  );
}
