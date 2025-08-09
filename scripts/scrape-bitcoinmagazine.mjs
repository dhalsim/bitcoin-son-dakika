#!/usr/bin/env node
// Scrapes Bitcoin Magazine search results for "bitcoin" and outputs JSON
// of { title, summary, url } for the latest ~50 items using HTML parsing.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { fetch } from "undici";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE = "https://bitcoinmagazine.com";
const SEARCH_URL = `${BASE}/search/bitcoin`;
const MAX_ITEMS = 50;

function normalizeText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; bitcoin-son-dakika/1.0)",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.text();
}

function parseSearch(html) {
  const $ = cheerio.load(html);
  const items = [];

  $("h3.entry-title, h3.entry-title.td-module-title").each((_, el) => {
    const a = $(el).find("a");
    const href = a.attr("href");
    const title = normalizeText(a.attr("title") || a.text());
    if (!href || !title) return;
    const url = href.startsWith("http") ? href : BASE + href;

    // sibling/nearby excerpt
    let summary = $(el).parent().find(".td-excerpt").first().text();
    if (!summary) {
      // try walking up and finding the excerpt in container
      summary = $(el).closest(".td-module-container").find(".td-excerpt").first().text();
    }
    summary = normalizeText(summary);

    // try to extract image from thumb container
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

async function fetchArticleTimestamp(url) {
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    // Try common meta tags
    const metaPublished =
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[name="article:published_time"]').attr("content") ||
      $('meta[property="og:published_time"]').attr("content") ||
      $('meta[name="publish_date"]').attr("content") ||
      "";
    let published = normalizeText(metaPublished);

    if (!published) {
      // Try JSON-LD
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
              return false; // break
            }
          }
        } catch {}
      });
    }

    if (!published) {
      // Try visible time element
      const timeAttr = $("time[datetime]").attr("datetime");
      published = normalizeText(timeAttr);
    }

    return published || "";
  } catch {
    return "";
  }
}

async function main() {
  const results = [];
  let page = 1;
  // The theme paginates with /page/n appended to the search URL
  while (results.length < MAX_ITEMS && page <= 5) {
    const url = page === 1 ? SEARCH_URL : `${SEARCH_URL}/page/${page}`;
    try {
      const html = await fetchHtml(url);
      const items = parseSearch(html);
      for (const it of items) {
        if (results.length >= MAX_ITEMS) break;
        if (!it.title || !it.url) continue;
        // Skip duplicates by URL
        if (results.some((r) => r.url === it.url)) continue;
        results.push(it);
      }
      page += 1;
    } catch (e) {
      break;
    }
  }

  // Enrich with publish timestamps (concurrent throttled)
  const concurrency = 8;
  let idx = 0;
  const out = new Array(results.length);
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (true) {
        const i = idx++;
        if (i >= results.length) break;
        const r = results[i];
        const published = await fetchArticleTimestamp(r.url);
        out[i] = { ...r, published };
      }
    }),
  );

  const outputPath = path.join(__dirname, "..", "data", "bitcoinmagazine-bitcoin-latest.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(out, null, 2), "utf8");
  console.log(`Saved ${out.length} items to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
