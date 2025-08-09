#!/usr/bin/env node
// Fetches CoinDesk Bitcoin news via CryptoCompare News API and outputs JSON
// of { title, summary, url, published } for the latest items.

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetch } from "undici";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = "https://data-api.cryptocompare.com/news/v1/article/list";
const PARAMS_PRIMARY = "limit=100&lang=EN&source_ids=coindesk&categories=BTC";
const PARAMS_FALLBACKS = [
  "limit=100&source_ids=coindesk&categories=Bitcoin",
  "limit=100&source_ids=coindesk",
  "limit=100&source_ids=coindesk&excludeCategories=Sponsored",
];

function normalizeText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

async function main() {
  async function fetchAttempt(query) {
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
    if (!res.ok) throw new Error(`Failed to fetch CoinDesk feed: ${res.status}`);
    return res.json();
  }

  let json = await fetchAttempt(PARAMS_PRIMARY);
  let articles = Array.isArray(json?.Data) ? json.Data : [];
  if (articles.length === 0) {
    for (const p of PARAMS_FALLBACKS) {
      try {
        json = await fetchAttempt(p);
        articles = Array.isArray(json?.Data) ? json.Data : [];
        if (articles.length > 0) break;
      } catch {}
    }
  } else {
    console.log(`Found ${articles.length} items`);
  }

  if (!articles || articles.length === 0) {
    const outputPath = path.join(__dirname, "..", "data", "coindesk-bitcoin-latest.json");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify([], null, 2), "utf8");
    console.log(`Saved 0 items to ${outputPath}`);
    return;
  }

  const results = articles
    .map((a) => {
      const title = normalizeText(a?.title || a?.TITLE);
      const summary = normalizeText(a?.body || a?.BODY || a?.SUBTITLE);
      const url = (a?.url || a?.URL || a?.source_info?.url || "").trim();
      const publishedSec = a?.published_on ?? a?.PUBLISHED_ON;
      const published = publishedSec ? new Date(publishedSec * 1000).toISOString() : "";

      // Prefer explicit image URL; CryptoCompare article has IMAGE_URL sometimes
      const image = (a?.imageurl || a?.IMAGE_URL || "").trim();

      return { title, summary, url, published, image };
    })
    .filter((x) => x.title && x.url)
    .filter((x) => /bitcoin|btc/i.test(`${x.title} ${x.summary}`));

  const outputPath = path.join(__dirname, "..", "data", "coindesk-bitcoin-latest.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved ${results.length} items to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
