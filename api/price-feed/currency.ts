import type TradingView from "@mathieuc/tradingview";

import { getPriceData } from "./common";
import type { PriceData, Ticker } from "./schemas";

export async function getCurrency(
  client: TradingView.Client,
): Promise<PriceData[]> {
  const prices: PriceData[] = [];

  const forex: Ticker[] = [
    { symbol: "EUR", description: "Avro", currency: "USD", emoji: "🇪🇺" },
    {
      symbol: "GBP",
      description: "İngiliz Sterlini",
      currency: "USD",
      emoji: "🇬🇧",
    },
    { symbol: "JPY", description: "Japon Yeni", currency: "USD", emoji: "🇯🇵" },
    {
      symbol: "CHF",
      description: "İsviçre Frangı",
      currency: "USD",
      emoji: "🇨🇭",
    },
    { symbol: "CNY", description: "Çin Yuanı", currency: "USD", emoji: "🇨🇳" },
    { symbol: "TRY", description: "Türk Lirası", currency: "USD", emoji: "🇹🇷" },
  ];

  for (const ticker of forex) {
    const priceData = await getPriceData(client, ticker);

    prices.push({
      name: ticker.description,
      symbol: priceData.symbol,
      value: priceData.current.toString(),
      change: priceData.change.toString(),
      category: "currency",
    });
  }

  return prices;
}
