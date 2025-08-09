#!/usr/bin/env node
// Fetches latest Cointelegraph search results for "bitcoin" via GraphQL API
// and outputs a JSON list of { title, summary, url } for the latest 50 items.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetch } from "undici";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_ITEMS = 50;
const API_URL = "https://conpletus.cointelegraph.com/v1/";
const BASE = "https://cointelegraph.com";

const QUERY = `query SearchPagePostsQuery($short: String = "en", $offset: Int!, $length: Int!, $query: String!) {
  locale(short: $short) {
    postsSearch(offset: $offset, length: $length, query: $query) {
      data {
        id
        slug
        views
        postTranslate {
          id
          title
          leadText
          avatar
          published
          publishedHumanFormat
          author { id slug authorTranslates { id name __typename } __typename }
          __typename
        }
        category { id slug categoryTranslates { id title __typename } __typename }
        author { id slug authorTranslates { id name __typename } __typename }
        postBadge { id label postBadgeTranslates { id title __typename } __typename }
        showShares
        showStats
        __typename
      }
      postsCount
      hasMorePosts
      __typename
    }
    __typename
  }
}`;

function normalizeText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

async function fetchSearchPage(offset, length) {
  const body = {
    operationName: "SearchPagePostsQuery",
    query: QUERY,
    variables: {
      cacheTimeInMS: 300000,
      length,
      offset,
      query: "bitcoin",
      short: "en",
    },
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept:
        "application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed",
      origin: "https://cointelegraph.com",
      referer: "https://cointelegraph.com/",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const items = data?.data?.locale?.postsSearch?.data || [];

  return items.map((it) => {
    const title = normalizeText(it?.postTranslate?.title);
    const summary = normalizeText(it?.postTranslate?.leadText);
    const published = normalizeText(it?.postTranslate?.published);
    const image = it?.postTranslate?.avatar || "";
    const categorySlug = it?.category?.slug || "news";
    const slug = it?.slug || "";
    // Construct canonical URL as /{category.slug}/{slug}
    const url = `${BASE}/${categorySlug}/${slug}`;
    return { title, summary, url, published, image };
  });
}

async function main() {
  const results = [];
  let offset = 0;
  const pageSize = 25;

  while (results.length < MAX_ITEMS) {
    const page = await fetchSearchPage(offset, pageSize);
    if (page.length === 0) break;
    for (const item of page) {
      if (results.length >= MAX_ITEMS) break;
      // Skip if missing critical fields
      if (!item.title || !item.url) continue;
      results.push(item);
    }
    offset += pageSize;
  }

  const outputPath = path.join(__dirname, "..", "data", "cointelegraph-bitcoin-latest.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved ${results.length} items to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
