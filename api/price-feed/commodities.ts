import type TradingView from "@mathieuc/tradingview";

import { getPriceData } from "./common";
import type { PriceData, Ticker } from "./schemas";

export async function getCommodities(
  client: TradingView.Client,
): Promise<PriceData[]> {
  const prices: PriceData[] = [];

  const commodities: Ticker[] = [
    { symbol: "XAU", description: "Altın", currency: "BTC", emoji: "🥇" },
    { symbol: "XAG", description: "Gümüş", currency: "BTC", emoji: "🥈" },
    { symbol: "XCU", description: "Bakır", currency: "USD", emoji: "🥉" },
    { symbol: "XPD", description: "Palladyum", currency: "USD", emoji: "🥈" },
    { symbol: "XPT", description: "Platin", currency: "USD", emoji: "🥉" },
  ];

  for (const ticker of commodities) {
    const priceData = await getPriceData(client, ticker);

    prices.push({
      name: ticker.description,
      symbol: priceData.symbol,
      value: priceData.current.toString(),
      change: priceData.change.toString(),
      category: "commodity",
    });
  }

  return prices;
}
