import type TradingView from "@mathieuc/tradingview";

import { getPriceData } from "./common";
import type { PriceData, Ticker } from "./schemas";

export async function getCrypto(
  client: TradingView.Client,
): Promise<[PriceData, PriceData[]]> {
  const prices: PriceData[] = [];

  const crypto: Ticker[] = [
    { symbol: "ETH", description: "Ethereum", currency: "BTC", emoji: "Ξ" },
    { symbol: "SOL", description: "Solana", currency: "BTC", emoji: "◎" },
    { symbol: "XRP", description: "XRP", currency: "BTC", emoji: "Ⓧ" },
    { symbol: "DOGE", description: "Dogecoin", currency: "BTC", emoji: "🐶" },
    { symbol: "ADA", description: "Cardano", currency: "BTC", emoji: "🌐" },
    { symbol: "XMR", description: "Monero", currency: "BTC", emoji: "🔒" },
  ];

  const btcPriceData = await getPriceData(client, {
    symbol: "BTC",
    description: "Bitcoin",
    currency: "USD",
    emoji: "₿",
  });

  const btcPrice: PriceData = {
    name: "Bitcoin",
    symbol: btcPriceData.symbol,
    value: btcPriceData.current.toString(),
    change: btcPriceData.change.toString(),
    category: "crypto",
  };

  for (const ticker of crypto) {
    const priceData = await getPriceData(client, ticker);

    prices.push({
      name: ticker.description,
      symbol: priceData.symbol,
      value: priceData.current.toString(),
      change: priceData.change.toString(),
      category: "crypto",
    });
  }

  return [btcPrice, prices];
}
