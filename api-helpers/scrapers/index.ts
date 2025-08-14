export { type ScraperSource, type ScrapedItem, SCRAPER_SOURCES } from "./types";
import { scrapeBitcoinMagazine } from "./bitcoinmagazine";
import { scrapeCoinDesk } from "./coindesk";
import { scrapeCointelegraph } from "./cointelegraph";
import { scrapeTheRage } from "./therage";
import { scrapeTradingView } from "./tradingview";
import type { ScraperSource, ScrapedItem } from "./types";

export async function fetchSource(source: ScraperSource): Promise<ScrapedItem[]> {
  switch (source) {
    case "coindesk":
      return scrapeCoinDesk();
    case "cointelegraph":
      return scrapeCointelegraph();
    case "tradingview":
      return scrapeTradingView();
    case "bitcoinmagazine":
      return scrapeBitcoinMagazine();
    case "therage":
      return scrapeTheRage();
    default:
      return [];
  }
}

export async function fetchAllSources(): Promise<ScrapedItem[]> {
  const [coindesk, cointelegraph, tradingview, bitcoinmagazine, therage] = await Promise.all([
    scrapeCoinDesk().catch(() => []),
    scrapeCointelegraph().catch(() => []),
    scrapeTradingView().catch(() => []),
    scrapeBitcoinMagazine().catch(() => []),
    scrapeTheRage().catch(() => []),
  ]);

  const all = [...coindesk, ...cointelegraph, ...tradingview, ...bitcoinmagazine, ...therage];

  all.sort((a, b) => {
    const ta = a.published ? Date.parse(a.published) : 0;
    const tb = b.published ? Date.parse(b.published) : 0;

    return tb - ta;
  });

  return all;
}
