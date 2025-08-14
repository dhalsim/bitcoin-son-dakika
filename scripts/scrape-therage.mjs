#!/usr/bin/env node
// Fetches The Rage RSS and outputs JSON of { title, summary, url, published }

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";
import { fetch } from "undici";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RSS_URL = "https://www.therage.co/rss/";
const MAX_ITEMS = 100;

function normalizeText(text) {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

async function fetchRssXml(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/rss+xml, application/xml, text/xml, */*",
      "user-agent": "Mozilla/5.0 (compatible; bitcoin-son-dakika/1.0)",
      referer: "https://www.therage.co/",
    },
  });
  if (!res.ok) throw new Error(`Failed to fetch RSS ${url}: ${res.status}`);
  return await res.text();
}

function stripHtml(html) {
  if (!html) return "";
  try {
    const $ = cheerio.load(`<div>${html}</div>`);
    return $.text();
  } catch {
    return html.replace(/<[^>]+>/g, " ");
  }
}

function parseRss(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];

  $("channel > item, feed > entry").each((_, el) => {
    const node = $(el);
    const title = normalizeText(node.find("title").first().text());
    // Prefer <link> text; some feeds use <link href="..."/>
    let url = normalizeText(node.find("link").first().text());
    if (!url) {
      const href = node.find("link").attr("href");
      if (href) url = normalizeText(href);
    }
    if (!url) {
      const guid = normalizeText(node.find("guid").first().text());
      if (guid) url = guid;
    }

    // Summary/description fallbacks
    let summary = node.find("description").first().text();
    if (!summary) summary = node.find("content").first().text();
    if (!summary) summary = node.find("content\\:encoded").first().text();
    if (!summary) summary = node.find("summary").first().text();
    summary = normalizeText(stripHtml(summary));

    // Published date fallbacks
    let publishedRaw =
      node.find("pubDate").first().text() ||
      node.find("published").first().text() ||
      node.find("updated").first().text() ||
      node.find("dc\\:date").first().text() ||
      "";
    publishedRaw = normalizeText(publishedRaw);
    let published = "";
    if (publishedRaw) {
      const d = new Date(publishedRaw);
      if (!Number.isNaN(d.getTime())) published = d.toISOString();
    }

    if (title && url) {
      items.push({ title, summary, url, published });
    }
  });

  return items;
}

async function main() {
  const xml = await fetchRssXml(RSS_URL);
  const items = parseRss(xml)
    .filter((x) => /bitcoin|\bbtc\b/i.test(`${x.title} ${x.summary}`))
    .slice(0, MAX_ITEMS);

  const outputPath = path.join(__dirname, "..", "data", "therage-bitcoin-latest.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(items, null, 2), "utf8");
  console.log(`Saved ${items.length} items to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
