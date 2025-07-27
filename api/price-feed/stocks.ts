import type TradingView from "@mathieuc/tradingview";

import { getPriceData } from "./common";
import type { PriceData, Ticker } from "./schemas";

export async function getStocks(
  client: TradingView.Client,
): Promise<PriceData[]> {
  const prices: PriceData[] = [];

  const stocks: Ticker[] = [
    { symbol: "AAPL", description: "Apple", currency: "USD", emoji: "🍎" },
    { symbol: "GOOG", description: "Google", currency: "USD", emoji: "🔍" },
    { symbol: "MSFT", description: "Microsoft", currency: "USD", emoji: "💻" },
    { symbol: "AMZN", description: "Amazon", currency: "USD", emoji: "🛒" },
    { symbol: "TSLA", description: "Tesla", currency: "USD", emoji: "🚗" },
    { symbol: "NVDA", description: "NVIDIA", currency: "USD", emoji: "🎮" },
    { symbol: "META", description: "Meta", currency: "USD", emoji: "🤖" },
    { symbol: "NFLX", description: "Netflix", currency: "USD", emoji: "🎥" },
  ];

  for (const ticker of stocks) {
    const priceData = await getPriceData(client, ticker);

    prices.push({
      name: ticker.description,
      symbol: priceData.symbol,
      value: priceData.current.toString(),
      change: priceData.change.toString(),
      category: "stock",
    });
  }

  return prices;
}
