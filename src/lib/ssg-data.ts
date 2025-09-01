import type { NostrEvent } from "nostr-tools";

import {
  extractArticleDataFromEvent,
  extractPodcastDataFromEvent,
  fetchNostrSets,
  pool,
  PROFILE_RELAYS,
} from "../../api-helpers/utils";

import type { EventItem, ProfileItem } from "./nip01";
import { getProfiles } from "./nip01";
import { fetchNip65RelaysForProfiles, type Nip65Relays } from "./nip65";

export type ContentItem = NewsItem | ArticleItem | PodcastItem;

export interface NewsItem {
  type: "news";
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
  type: "article";
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

export interface PodcastItem {
  type: "podcast";
  id: string;
  title: string;
  content: string;
  tags: string[];
  event: EventItem;
  author: ProfileItem;
  publishedAt: number;
  summary: string;
  identifier: string;
  audioUrl: string;
  duration: string;
  episodeNumber: number;
  image?: string;
  transcriptUrl?: string;
  chaptersUrl?: string;
}

export interface EducationItem {
  type: "education";
}

export interface SSGData {
  news: NewsItem[];
  articles: ArticleItem[];
  podcasts: PodcastItem[];
  lastUpdated: number;
}

function processNewsEvent(event: EventItem, author: ProfileItem): NewsItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const imageTag = event.tags.find((tag) => tag[0] === "image");

  return {
    type: "news",
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
  return { author, ...extractArticleDataFromEvent(event) };
}

function processPodcastEvent(event: EventItem, author: ProfileItem): PodcastItem {
  return { author, ...extractPodcastDataFromEvent(event) };
}

export async function fetchSSGData(): Promise<SSGData> {
  console.log("Fetching SSG data from Nostr relays...");

  const { newsTags, articleTags, podcastTags } = await fetchNostrSets([
    "news",
    "articles",
    "podcasts",
  ]);

  const newsRelays = [...new Set(newsTags.flatMap((tag) => tag.relays))];
  const articleRelays = [...new Set(articleTags.flatMap((tag) => tag.relays))];
  const podcastRelays = [...new Set(podcastTags.flatMap((tag) => tag.relays))];

  const articleResults = articleTags.map((tag) => {
    const [_kind, pubkey, dTag] = tag.aTag.split(":");

    return {
      dTag,
      pubkey,
      relays: tag.relays,
    };
  });

  const podcastResults = podcastTags.map((tag) => {
    const [_kind, pubkey, dTag] = tag.aTag.split(":");

    return {
      dTag,
      pubkey,
      relays: tag.relays,
    };
  });

  const tasks: Promise<NostrEvent[]>[] = [];

  if (newsTags.length > 0) {
    tasks.push(
      pool.querySync(newsRelays, {
        ids: newsTags.map((tag) => tag.eTag),
        kinds: [1],
      }),
    );
  }

  if (articleTags.length > 0) {
    tasks.push(
      pool.querySync(articleRelays, {
        "#d": articleResults.map((result) => result.dTag),
        authors: articleResults.map((result) => result.pubkey),
        kinds: [30023],
      }),
    );
  }

  if (podcastTags.length > 0) {
    tasks.push(
      pool.querySync(podcastRelays, {
        "#d": podcastResults.map((result) => result.dTag),
        authors: podcastResults.map((result) => result.pubkey),
        kinds: [30023],
      }),
    );
  }

  const [newsEvents = [], articlesEvents = [], podcastsEvents = []] = await Promise.all(tasks);

  console.log("fetched events", {
    newsEvents: newsEvents.length,
    articlesEvents: articlesEvents.length,
    podcastsEvents: podcastsEvents.length,
  });

  if (newsEvents.length !== newsTags.length) {
    throw new Error("News events length does not match news tags length");
  }

  if (articlesEvents.length !== articleTags.length) {
    throw new Error("Articles events length does not match article tags length");
  }

  if (podcastsEvents.length !== podcastTags.length) {
    throw new Error("Podcasts events length does not match podcast tags length");
  }

  const profilePubkeys = [
    ...new Set([...newsEvents, ...articlesEvents, ...podcastsEvents].map((item) => item.pubkey)),
  ];

  console.log("profilePubkeys", profilePubkeys.length);

  const nip65Map = await fetchNip65RelaysForProfiles(PROFILE_RELAYS, profilePubkeys);
  console.log(`Fetched ${nip65Map.size} nip65 relays for profiles...`);

  const profileEvents = await getProfileEvents(profilePubkeys, nip65Map);
  console.log(`Fetched ${profileEvents.size} profiles...`);

  const newsItems: NewsItem[] = newsEvents.map((ne) => {
    const profile = profileEvents.get(ne.pubkey);

    if (!profile) {
      throw new Error(`Author not found or profile can't be parsed: ${ne.pubkey}`);
    }

    const relayHintTag = newsTags.find((tag) => tag.eTag === ne.id);

    if (!relayHintTag) {
      throw new Error(`Relay hint not found: ${ne.id}`);
    }

    return processNewsEvent({ ...ne, relays: relayHintTag.relays }, profile);
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

    return processArticleEvent({ ...ae, relays: relayHintTag.relays }, profile);
  });

  const podcastItems: PodcastItem[] = podcastsEvents.map((pe) => {
    const profile = profileEvents.get(pe.pubkey);

    if (!profile) {
      throw new Error(`Author not found or profile can't be parsed: ${pe.pubkey}`);
    }

    const dTag = pe.tags.find((tag) => tag[0] === "d");

    if (!dTag) {
      throw new Error(`D tag not found: ${pe.id}`);
    }

    const aTag = `30023:${pe.pubkey}:${dTag[1]}`;

    const relayHintTag = podcastTags.find((tag) => tag.aTag === aTag);

    if (!relayHintTag) {
      throw new Error(`Relay hint not found: ${pe.id}`);
    }

    return processPodcastEvent({ ...pe, relays: relayHintTag.relays }, profile);
  });

  // Sort by publication date (newest first)
  newsItems.sort((a, b) => b.publishedAt - a.publishedAt);
  articleItems.sort((a, b) => b.publishedAt - a.publishedAt);
  podcastItems.sort((a, b) => b.publishedAt - a.publishedAt);

  console.log(
    `Fetched ${newsItems.length} news items, ${articleItems.length} articles, and ${podcastItems.length} podcasts`,
  );

  return {
    news: newsItems,
    articles: articleItems,
    podcasts: podcastItems,
    lastUpdated: Date.now(), // Use actual build time for SSG
  };
}

export function getProfileEvents(
  profilePubkeys: string[],
  nip65Map: Map<string, Nip65Relays>,
): Promise<Map<string, ProfileItem>> {
  return new Promise((resolve) => {
    const subCloser = getProfiles({
      authors: profilePubkeys,
      nip65Map,
      onUpdate: (profiles) => {
        resolve(profiles);

        subCloser();
      },
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

  ssgData.podcasts.forEach((item) => {
    item.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet);
}

// Helper function to get unique profiles from SSG data
export function getUniqueAuthors(ssgData: SSGData): ProfileItem[] {
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

  // Collect profiles from podcasts
  ssgData.podcasts.forEach((item) => {
    if (getDisplayName(item.author, item.author.pubkey)) {
      profileMap.set(item.author.pubkey, item.author);
    }
  });

  return Array.from(profileMap.values());
}

// Helper function to create profile slug from display name
export function createAuthorSlug(displayName: string): string {
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
export function findAuthorBySlug(ssgData: SSGData, slug: string): ProfileItem | undefined {
  const profiles = getUniqueAuthors(ssgData);

  return profiles.find(
    (profile) => createAuthorSlug(getDisplayName(profile, profile.pubkey)) === slug,
  );
}
