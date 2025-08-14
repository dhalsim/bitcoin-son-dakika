import type { ScrapedItem } from "./types";
import { normalizeText } from "./utils";

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
