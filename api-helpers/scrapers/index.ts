import * as cheerio from "cheerio";

export type ScraperSource = "coindesk" | "cointelegraph" | "tradingview" | "bitcoinmagazine";

export const SCRAPER_SOURCES: ScraperSource[] = [
  "coindesk",
  "cointelegraph",
  "tradingview",
  "bitcoinmagazine",
];

export type ScrapedItem = {
  title: string;
  summary?: string;
  url: string;
  published?: string;
  image?: string;
  source: ScraperSource;
};

function normalizeText(text?: string | null): string {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

// TradingView BTCUSD news via public mediator
export async function scrapeTradingView(): Promise<ScrapedItem[]> {
  const API =
    "https://news-mediator.tradingview.com/public/view/v1/symbol?filter=lang%3Aen&filter=symbol%3ABITSTAMP%3ABTCUSD&client=web";

  const res = await fetch(API, {
    headers: {
      accept: "*/*",
      origin: "https://www.tradingview.com",
      referer: "https://www.tradingview.com/",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
    },
  });

  if (!res.ok) {
    throw new Error(`TradingView request failed: ${res.status}`);
  }

  const json: any = await res.json();
  const items = Array.isArray(json?.items) ? json.items : json?.data || [];

  return items
    .map((it: any) => {
      const title = normalizeText(it?.title);
      const summary = "";
      const url = (it?.link || "").trim();
      const published = it?.published ? new Date(it.published * 1000).toISOString() : undefined;
      const image = undefined;

      return { title, summary, url, published, image, source: "tradingview" as const };
    })
    .filter((x: ScrapedItem) => x.title && x.url);
}

// CoinDesk via CryptoCompare news API
export async function scrapeCoinDesk(): Promise<ScrapedItem[]> {
  const API_BASE = "https://data-api.cryptocompare.com/news/v1/article/list";
  const PARAMS_PRIMARY = "limit=100&lang=EN&source_ids=coindesk&categories=BTC";
  const PARAMS_FALLBACKS = [
    "limit=100&source_ids=coindesk&categories=Bitcoin",
    "limit=100&source_ids=coindesk",
    "limit=100&source_ids=coindesk&excludeCategories=Sponsored",
  ];

  async function fetchAttempt(query: string) {
    const url = `${API_BASE}?${query}`;
    const res = await fetch(url, {
      headers: {
        accept: "*/*",
        origin: "https://www.coindesk.com",
        referer: "https://www.coindesk.com/",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
      },
    });
    if (!res.ok) {
      throw new Error(`CoinDesk feed failed: ${res.status}`);
    }

    return res.json();
  }

  let json: any = await fetchAttempt(PARAMS_PRIMARY);
  let articles: any[] = Array.isArray(json?.Data) ? json.Data : [];
  if (articles.length === 0) {
    for (const p of PARAMS_FALLBACKS) {
      try {
        json = await fetchAttempt(p);
        articles = Array.isArray(json?.Data) ? json.Data : [];
        if (articles.length > 0) {
          break;
        }
      } catch {
        // ignore and try next
      }
    }
  }

  return (articles || [])
    .map((a: any) => {
      const title = normalizeText(a?.title || a?.TITLE);
      const summary = normalizeText(a?.body || a?.BODY || a?.SUBTITLE);
      const url = (a?.url || a?.URL || a?.source_info?.url || "").trim();
      const publishedSec = a?.published_on ?? a?.PUBLISHED_ON;
      const published = publishedSec ? new Date(publishedSec * 1000).toISOString() : undefined;
      const image = (a?.imageurl || a?.IMAGE_URL || "").trim() || undefined;

      return { title, summary, url, published, image, source: "coindesk" as const };
    })
    .filter((x: ScrapedItem) => x.title && x.url)
    .filter((x: ScrapedItem) => /bitcoin|btc/i.test(`${x.title} ${x.summary || ""}`));
}

// Cointelegraph GraphQL search for "bitcoin"
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
      const categorySlug = it?.category?.slug || "news";
      const slug = it?.slug || "";
      const url = `${BASE}/${categorySlug}/${slug}`;

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

// Bitcoin Magazine search + lightweight enrichment
export async function scrapeBitcoinMagazine(): Promise<ScrapedItem[]> {
  const BASE = "https://bitcoinmagazine.com";
  const SEARCH_URL = `${BASE}/search/bitcoin`;

  async function fetchHtml(url: string) {
    const res = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; bitcoin-son-dakika/1.0)" },
    });
    if (!res.ok) {
      throw new Error(`Bitcoin Magazine fetch failed: ${res.status}`);
    }

    return res.text();
  }

  function parseSearch(html: string) {
    const $ = cheerio.load(html);
    const items: { title: string; summary: string; url: string; image?: string }[] = [];
    $("h3.entry-title, h3.entry-title.td-module-title").each((_, el) => {
      const a = $(el).find("a");
      const href = a.attr("href");
      const title = normalizeText(a.attr("title") || a.text());
      if (!href || !title) {
        return;
      }

      const url = href.startsWith("http") ? href : BASE + href;
      let summary = $(el).parent().find(".td-excerpt").first().text();
      if (!summary) {
        summary = $(el).closest(".td-module-container").find(".td-excerpt").first().text();
      }

      summary = normalizeText(summary);
      let image = "";
      const thumb = $(el)
        .closest(".td-module-container")
        .find(".td-thumb-css")
        .css("background-image");
      if (thumb && /url\(("|')?(.*?)("|')?\)/.test(thumb)) {
        const m = thumb.match(/url\(("|')?(.*?)("|')?\)/);
        image = m?.[2] || "";
      }

      items.push({ title, summary, url, image });
    });

    return items;
  }

  async function fetchArticleTimestamp(url: string) {
    try {
      const html = await fetchHtml(url);
      const $ = cheerio.load(html);
      const metaPublished =
        $('meta[property="article:published_time"]').attr("content") ||
        $('meta[name="article:published_time"]').attr("content") ||
        $('meta[property="og:published_time"]').attr("content") ||
        $('meta[name="publish_date"]').attr("content") ||
        "";
      let published = normalizeText(metaPublished);
      if (!published) {
        $('script[type="application/ld+json"]').each((_, el) => {
          try {
            const json = JSON.parse($(el).contents().text());
            const graphs = Array.isArray(json) ? json : json["@graph"] ? json["@graph"] : [json];
            for (const node of graphs) {
              if (
                node &&
                (node["@type"] === "NewsArticle" || node["@type"] === "Article") &&
                node.datePublished
              ) {
                published = node.datePublished;

                return false as any;
              }
            }
          } catch {
            // ignore
          }
        });
      }

      if (!published) {
        const timeAttr = $("time[datetime]").attr("datetime");
        published = normalizeText(timeAttr || "");
      }

      return published || undefined;
    } catch {
      return undefined;
    }
  }

  const results: ScrapedItem[] = [];
  let page = 1;
  const maxItems = 50;
  while (results.length < maxItems && page <= 5) {
    const url = page === 1 ? SEARCH_URL : `${SEARCH_URL}/page/${page}`;
    try {
      const html = await fetchHtml(url);
      const items = parseSearch(html);
      for (const it of items) {
        if (results.length >= maxItems) {
          break;
        }

        if (!it.title || !it.url) {
          continue;
        }

        if (results.some((r) => r.url === it.url)) {
          continue;
        }

        results.push({ ...it, source: "bitcoinmagazine" });
      }

      page += 1;
    } catch {
      break;
    }
  }

  // Enrich published concurrently with a small pool
  const concurrency = 6;
  let idx = 0;
  const out = new Array(results.length) as ScrapedItem[];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (true) {
        const i = idx++;
        if (i >= results.length) {
          break;
        }

        const r = results[i];
        const published = await fetchArticleTimestamp(r.url);
        out[i] = { ...r, published };
      }
    }),
  );

  return out;
}

export async function fetchSource(source: ScraperSource): Promise<ScrapedItem[]> {
  switch (source) {
    case "coindesk":
      return scrapeCoinDesk();
    case "cointelegraph":
      return scrapeCointelegraph();
    case "tradingview":
      return scrapeTradingView();
    case "bitcoinmagazine":
      return scrapeBitcoinMagazine();
    default:
      return [];
  }
}

export async function fetchAllSources(): Promise<ScrapedItem[]> {
  const [coindesk, cointelegraph, tradingview, bitcoinmagazine] = await Promise.all([
    scrapeCoinDesk().catch(() => []),
    scrapeCointelegraph().catch(() => []),
    scrapeTradingView().catch(() => []),
    scrapeBitcoinMagazine().catch(() => []),
  ]);

  const all = [...coindesk, ...cointelegraph, ...tradingview, ...bitcoinmagazine];

  // Sort by published desc when available
  all.sort((a, b) => {
    const ta = a.published ? Date.parse(a.published) : 0;
    const tb = b.published ? Date.parse(b.published) : 0;

    return tb - ta;
  });

  return all;
}
