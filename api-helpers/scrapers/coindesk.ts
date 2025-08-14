import type { ScrapedItem } from "./types";
import { normalizeText } from "./utils";

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
        // try next
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
