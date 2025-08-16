import type { ScrapedItem } from "./types.js";
import { normalizeText } from "./utils.js";

export async function scrapeCointelegraph(): Promise<ScrapedItem[]> {
  const API_URL = "https://conpletus.cointelegraph.com/v1/";
  const BASE = "https://cointelegraph.com";

  const QUERY = `query SearchPagePostsQuery($short: String = "en", $offset: Int!, $length: Int!, $query: String!) {
  locale(short: $short) {
    postsSearch(offset: $offset, length: $length, query: $query) {
      data { slug category { slug } postTranslate { title leadText avatar published } }
    }
  }
}`;

  async function fetchPage(offset: number, length: number) {
    const body = {
      operationName: "SearchPagePostsQuery",
      query: QUERY,
      variables: { cacheTimeInMS: 300000, length, offset, query: "bitcoin", short: "en" },
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
      throw new Error(`Cointelegraph GraphQL failed: ${res.status}`);
    }

    const data = await res.json();
    const items = data?.data?.locale?.postsSearch?.data || [];

    return items.map((it: any) => {
      const title = normalizeText(it?.postTranslate?.title);
      const summary = normalizeText(it?.postTranslate?.leadText);
      const published = normalizeText(it?.postTranslate?.published) || undefined;
      const image = it?.postTranslate?.avatar || undefined;
      const slug = it?.slug || "";
      const url = `${BASE}/news/${slug}`;

      return { title, summary, url, published, image, source: "cointelegraph" as const };
    });
  }

  const results: ScrapedItem[] = [];
  let offset = 0;
  const pageSize = 25;
  const maxItems = 50;
  while (results.length < maxItems) {
    const page = await fetchPage(offset, pageSize);
    if (page.length === 0) {
      break;
    }

    for (const item of page) {
      if (results.length >= maxItems) {
        break;
      }

      if (!item.title || !item.url) {
        continue;
      }

      results.push(item);
    }

    offset += pageSize;
  }

  return results;
}
