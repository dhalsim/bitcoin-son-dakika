import type { NostrEvent } from "nostr-tools";

import { fetchNostrSets, pool, PROFILE_RELAYS } from "../../api/utils";

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  publishedAt: number;
  author: ProfileItem;
  tags: string[];
  category?: string;
  relay?: string;
  image?: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  content: string;
  summary?: string;
  publishedAt: number;
  author: ProfileItem;
  tags: string[];
  category?: string;
  relay?: string;
  identifier?: string;
  image?: string;
}

export interface ProfileItem {
  pubkey: string;
  display_name?: string;
  picture?: string;
  about?: string;
  website?: string;
  nip05?: string;
  lud06?: string;
  lud16?: string;
}

export interface SSGData {
  news: NewsItem[];
  articles: ArticleItem[];
  lastUpdated: number;
}

function processNewsEvent(event: NostrEvent, author: ProfileItem): NewsItem {
  const titleTag = event.tags.find((tag) => tag[0] === "title");
  const summaryTag = event.tags.find((tag) => tag[0] === "summary");
  const categoryTag = event.tags.find((tag) => tag[0] === "t");
  const imageTag = event.tags.find((tag) => tag[0] === "image");

  return {
    id: event.id,
    title: titleTag?.[1] || "Untitled",
    content: event.content,
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

  const profileProfiles: ProfileItem[] = await pool
    .querySync(PROFILE_RELAYS, {
      authors: Array.from(profilePubkeys),
      kinds: [0],
    })
    .then((ex) => {
      return ex
        .map((e: NostrEvent): ProfileItem => {
          let parsedProfile;

          try {
            parsedProfile = JSON.parse(e.content);
          } catch {
            throw new Error("Invalid profile JSON");
          }

          return {
            pubkey: e.pubkey,
            display_name: parsedProfile?.display_name || parsedProfile?.name,
            picture: parsedProfile?.picture,
            about: parsedProfile?.about,
            website: parsedProfile?.website,
            nip05: parsedProfile?.nip05,
            lud06: parsedProfile?.lud06,
            lud16: parsedProfile?.lud16,
          };
        })
        .filter((p) => p !== null);
    });

  const newsItems: NewsItem[] = newsEvents.map((ne) => {
    const author = profileProfiles.find((p) => p.pubkey === ne.pubkey);

    if (!author) {
      throw new Error(`Author not found: ${ne.pubkey}`);
    }

    return processNewsEvent(ne, author);
  });

  const articleItems: ArticleItem[] = articlesEvents.map((ae) => {
    const author = profileProfiles.find((p) => p.pubkey === ae.pubkey);

    if (!author) {
      throw new Error(`Author not found: ${ae.pubkey}`);
    }

    return processArticleEvent(ae, author);
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
