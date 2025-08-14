export type ScraperSource =
  | "coindesk"
  | "cointelegraph"
  | "tradingview"
  | "bitcoinmagazine"
  | "therage";

export const SCRAPER_SOURCES: ScraperSource[] = [
  "coindesk",
  "cointelegraph",
  "tradingview",
  "bitcoinmagazine",
  "therage",
];

export type ScrapedItem = {
  title: string;
  summary?: string;
  url: string;
  published?: string;
  image?: string;
  source: ScraperSource;
};
