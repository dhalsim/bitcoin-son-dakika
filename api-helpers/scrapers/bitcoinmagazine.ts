import * as cheerio from "cheerio";

import type { ScrapedItem } from "./types.js";
import { normalizeText } from "./utils.js";

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
        out[i] = { ...r, published } as ScrapedItem;
      }
    }),
  );

  return out;
}
