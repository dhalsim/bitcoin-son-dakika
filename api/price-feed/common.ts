import type TradingView from "@mathieuc/tradingview";

import type { Ticker } from "./schemas";

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function getSymbol(ticker: Ticker) {
  if (ticker.symbol === "BTC" && ticker.currency === "USD") {
    return `${ticker.symbol}USD`;
  }

  switch (ticker.currency) {
    case "BTC":
      return `${ticker.symbol}BTC`;
    case "USD":
      return `${ticker.symbol}USD/BTCUSD`;
    default:
      return assertNever(ticker.currency);
  }
}

type PriceData = {
  symbol: string;
  current: number;
  change: number;
};

export async function getPriceData(
  client: TradingView.Client,
  ticker: Ticker,
): Promise<PriceData> {
  return new Promise((resolve, reject) => {
    const chart = new client.Session.Chart();

    const symbol = getSymbol(ticker);

    chart.setMarket(symbol, {
      timeframe: "D",
      range: 2,
    });

    chart.onUpdate(() => {
      const current = chart.periods[0].close;
      const previous = chart.periods[1].close;

      const percentageChange = ((current - previous) / previous) * 100;

      const data: PriceData = {
        symbol,
        current,
        change: percentageChange,
      };

      resolve(data);

      cleanup();
    });

    chart.onError((...error) => {
      reject(new Error(`Chart error for ${symbol}: ${error.join(" ")}`));

      cleanup();
    });

    function cleanup() {
      chart.delete();
    }
  });
}
