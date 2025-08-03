import type { NostrEvent } from "nostr-tools";

import { fetchNostrSets, pool } from "../../api-helpers/utils";

import type { ProfileItem } from "./nip01";
import { parseProfileEvent, getKind0Events } from "./nip01";

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  event: NostrEvent;
  relayHint: string;
  summary?: string;
  publishedAt: number;
  author: ProfileItem;
  tags: string[];
  category?: string;
  image?: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  content: string;
  event: NostrEvent;
  relayHint: string;
  summary?: string;
  publishedAt: number;
  author: ProfileItem;
  tags: string[];
  category?: string;
  identifier?: string;
  image?: string;
}

export interface SSGData {
  news: NewsItem[];
  articles: ArticleItem[];
  lastUpdated: number;
}

function processNewsEvent(
  event: NostrEvent,
  author: ProfileItem,
  relayHint: string,
): NewsItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const categoryTag = event.tags.find((tag) => tag[0] === "t");
  const imageTag = event.tags.find((tag) => tag[0] === "image");

  return {
    id: event.id,
    title: titleTag?.[1] || "Untitled",
    content: event.content,
    event,
    relayHint,
    summary: summaryTag?.[1],
    publishedAt: event.created_at,
    author,
    tags: event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]),
    category: categoryTag?.[1],
    image: imageTag?.[1] || "",
  };
}

function processArticleEvent(
  event: NostrEvent,
  author: ProfileItem,
  relayHint: string,
): ArticleItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const categoryTag = event.tags.find((tag) => tag[0] === "t");
  const dTag = event.tags.find((tag) => tag[0] === "d");
  const imageTag = event.tags.find((tag) => tag[0] === "image");

  return {
    id: event.id,
    title: titleTag?.[1] || "Untitled Article",
    content: event.content,
    event,
    relayHint,
    summary: summaryTag?.[1],
    publishedAt: event.created_at,
    author,
    tags: event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]),
    category: categoryTag?.[1],
    identifier: dTag?.[1],
    image: imageTag?.[1] || "",
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

  const profilePubkeys = new Set(
    [...newsEvents, ...articlesEvents].map((item) => item.pubkey),
  );

  const profileEvents = await getProfileEvents(Array.from(profilePubkeys));

  const newsItems: NewsItem[] = newsEvents.map((ne) => {
    const author = profileEvents.get(ne.pubkey);

    if (!author) {
      throw new Error(`Author not found: ${ne.pubkey}`);
    }

    const profile = parseProfileEvent(author);

    const relayHintTag = newsTags.find((tag) => tag.eTag === ne.id);

    if (!relayHintTag) {
      throw new Error(`Relay hint not found: ${ne.id}`);
    }

    return processNewsEvent(ne, profile, relayHintTag.relay);
  });

  const articleItems: ArticleItem[] = articlesEvents.map((ae) => {
    const author = profileEvents.get(ae.pubkey);

    if (!author) {
      throw new Error(`Author not found: ${ae.pubkey}`);
    }

    const profile = parseProfileEvent(author);

    const dTag = ae.tags.find((tag) => tag[0] === "d");

    if (!dTag) {
      throw new Error(`D tag not found: ${ae.id}`);
    }

    const aTag = `30023:${ae.pubkey}:${dTag[1]}`;

    const relayHintTag = articleTags.find((tag) => tag.aTag === aTag);

    if (!relayHintTag) {
      throw new Error(`Relay hint not found: ${ae.id}`);
    }

    return processArticleEvent(ae, profile, relayHintTag.relay);
  });

  // Sort by publication date (newest first)
  newsItems.sort((a, b) => b.publishedAt - a.publishedAt);
  articleItems.sort((a, b) => b.publishedAt - a.publishedAt);

  console.log(
    `Fetched ${newsItems.length} news items and ${articleItems.length} articles`,
  );

  return {
    news: newsItems.slice(0, 50), // Limit to recent 50 news
    articles: articleItems.slice(0, 50), // Limit to recent 50 articles
    lastUpdated: Date.now(), // Use actual build time for SSG
  };
}

export function getProfileEvents(
  profilePubkeys: string[],
): Promise<Map<string, NostrEvent>> {
  return new Promise((resolve, reject) => {
    const profileEvents = new Map<string, NostrEvent>();

    getKind0Events(
      profilePubkeys,
      (p, kind0Event) => {
        if (profileEvents.has(p)) {
          const existingProfile = profileEvents.get(p);

          if (
            existingProfile &&
            existingProfile.created_at < kind0Event.created_at
          ) {
            // update profile event with newer one
            profileEvents.set(p, kind0Event);
          }

          return;
        }

        profileEvents.set(p, kind0Event);
      },
      (reasons) => {
        if (profileEvents.size === profilePubkeys.length) {
          return resolve(profileEvents);
        }

        console.log("Some profile events not found, reasons:", reasons);

        reject(new Error("Some profile events not found"));
      },
    );
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
    if (item.author.display_name) {
      profileMap.set(item.author.pubkey, item.author);
    }
  });

  // Collect profiles from articles
  ssgData.articles.forEach((item) => {
    if (item.author.display_name) {
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

// Helper function to find profile by slug
export function findProfileBySlug(
  ssgData: SSGData,
  slug: string,
): ProfileItem | undefined {
  const profiles = getUniqueProfiles(ssgData);

  return profiles.find(
    (profile) =>
      profile.display_name && createProfileSlug(profile.display_name) === slug,
  );
}
