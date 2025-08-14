import * as cheerio from "cheerio";

import type { ScrapedItem } from "./types.js";
import { normalizeText, stripHtml } from "./utils.js";

const RSS_URL = "https://www.therage.co/rss/";

export async function scrapeTheRage(): Promise<ScrapedItem[]> {
  async function fetchRssXml(url: string) {
    const res = await fetch(url, {
      headers: {
        accept: "application/rss+xml, application/xml, text/xml, */*",
        "user-agent": "Mozilla/5.0 (compatible; bitcoin-son-dakika/1.0)",
        referer: "https://www.therage.co/",
      },
    });
    if (!res.ok) {
      throw new Error(`The Rage RSS failed: ${res.status}`);
    }

    return res.text();
  }

  function parseRss(xml: string) {
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: Omit<ScrapedItem, "source">[] = [];
    $("channel > item, feed > entry").each((_, el) => {
      const node = $(el);
      const title = normalizeText(node.find("title").first().text());
      let url = normalizeText(node.find("link").first().text());
      if (!url) {
        const href = node.find("link").attr("href");
        if (href) {
          url = normalizeText(href);
        }
      }

      if (!url) {
        const guid = normalizeText(node.find("guid").first().text());
        if (guid) {
          url = guid;
        }
      }

      let summary = node.find("description").first().text();
      if (!summary) {
        summary = node.find("content").first().text();
      }

      if (!summary) {
        summary = node.find("content\\:encoded").first().text();
      }

      if (!summary) {
        summary = node.find("summary").first().text();
      }

      summary = normalizeText(stripHtml(summary));
      let publishedRaw =
        node.find("pubDate").first().text() ||
        node.find("published").first().text() ||
        node.find("updated").first().text() ||
        node.find("dc\\:date").first().text() ||
        "";
      publishedRaw = normalizeText(publishedRaw);
      let published: string | undefined = undefined;
      if (publishedRaw) {
        const d = new Date(publishedRaw);
        if (!Number.isNaN(d.getTime())) {
          published = d.toISOString();
        }
      }

      if (title && url) {
        items.push({ title, summary, url, published });
      }
    });

    return items;
  }

  const xml = await fetchRssXml(RSS_URL);
  const parsed = parseRss(xml)
    .filter((x) => /bitcoin|\bbtc\b/i.test(`${x.title} ${x.summary || ""}`))
    .slice(0, 100);

  return parsed.map((x) => ({ ...x, source: "therage" as const }));
}
