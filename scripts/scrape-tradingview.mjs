#!/usr/bin/env node
// Fetches TradingView news for BTCUSD and outputs JSON of { title, summary, url, published, provider }

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API =
  "https://news-mediator.tradingview.com/public/view/v1/symbol?filter=lang%3Aen&filter=symbol%3ABITSTAMP%3ABTCUSD&client=web";

function normalizeText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

async function main() {
  const res = await fetch(API, {
    headers: {
      accept: "*/*",
      origin: "https://www.tradingview.com",
      referer: "https://www.tradingview.com/",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch TradingView: ${res.status}`);
  const json = await res.json();
  const items = Array.isArray(json?.items) ? json.items : json?.data || [];

  const results = items
    .map((it) => {
      // API returns: id, title, published (unix seconds), link, provider{name}
      const title = normalizeText(it?.title);
      const summary = ""; // mediator feed typically doesn't include body; leave empty
      const url = it?.link || "";
      const published = it?.published ? new Date(it.published * 1000).toISOString() : "";
      const provider = it?.provider?.name || it?.provider?.id || "";
      return { title, summary, url, published, provider };
    })
    .filter((x) => x.title && x.url);

  const outputPath = path.join(__dirname, "..", "data", "tradingview-btcusd-latest.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2), "utf8");
  console.log(`Saved ${results.length} items to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
