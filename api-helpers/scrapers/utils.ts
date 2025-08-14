import * as cheerio from "cheerio";

export function normalizeText(text?: string | null): string {
  return (text || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

export function stripHtml(html?: string | null): string {
  if (!html) {
    return "";
  }

  try {
    const $ = cheerio.load(`<div>${html}</div>`);

    return $.text();
  } catch {
    return html.replace(/<[^>]+>/g, " ");
  }
}
