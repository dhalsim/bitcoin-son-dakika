import TradingView from "@mathieuc/tradingview";
import { createClient } from "redis";

import {
  applyCacheHeaders,
  ErrorResponse,
  SuccessResponse,
} from "../../api-helpers/utils.js";
import {
  type BaseEndpointResponse,
  type PriceData,
} from "../../src/types/api.js";

const redis = await createClient({
  url: process.env.REDIS_URL,
}).connect();

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    const session = await redis.get("session");
    const signature = await redis.get("signature");

    if (!session || !signature) {
      const user = await TradingView.loginUser(
        process.env.TRADINGVIEW_USERNAME,
        process.env.TRADINGVIEW_PASSWORD,
        false,
      );

      await redis.set("session", user.session);
      await redis.set("signature", user.signature);
    }

    const client = new TradingView.Client({
      token: session,
      signature: signature,
    });

    const [currency, btcPrice, commodities, stocks] = await Promise.all([
      getCurrency(client),
      getCrypto(client),
      getCommodities(client),
      getStocks(client),
    ]);

    const prices: PriceData[] = [...currency, ...commodities, ...stocks];

    const data: BaseEndpointResponse = {
      success: true,
      prices,
      btcPrice: btcPrice.value,
      btcChange: btcPrice.change,
      lastUpdated: new Date().toISOString(),
      source: "new-price-feed",
      totalAssets: prices.length,
    };

    const response = SuccessResponse(data);

    // Apply caching headers
    return applyCacheHeaders(response, {
      maxAge: 60, // Cache for 1 minute
      staleWhileRevalidate: 30, // Allow stale content for 30 seconds
      cdnMaxAge: 60, // CDN cache for 1 minute
    });
  } catch (error) {
    console.error("New Price Feed API error:", error);

    const errorResponse = ErrorResponse(
      error instanceof Error ? error : new Error("Unknown error"),
      "Failed to fetch new price feed data",
      500,
    );

    return applyCacheHeaders(errorResponse, {
      maxAge: 60,
      staleWhileRevalidate: 30,
      cdnMaxAge: 60,
    });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

async function getCommodities(
  client: TradingView.Client,
): Promise<PriceData[]> {
  const commodities: Ticker[] = [
    {
      symbol: "XAU",
      description: "Altın",
      currency: "BTC",
      emoji: "🥇",
      category: "commodity",
    },
    {
      symbol: "XAG",
      description: "Gümüş",
      currency: "BTC",
      emoji: "🥈",
      category: "commodity",
    },
  ];

  return Promise.all(
    commodities.map(async (ticker) => {
      const priceData = await getPriceData(client, ticker);

      return {
        name: ticker.description,
        symbol: priceData.symbol,
        value: priceData.current.toString(),
        change: priceData.change.toString(),
        category: "commodity",
      };
    }),
  );
}

async function getCrypto(client: TradingView.Client): Promise<PriceData> {
  // const crypto: Ticker[] = [
  //   {
  //     symbol: "ETH",
  //     description: "Ethereum",
  //     currency: "BTC",
  //     emoji: "Ξ",
  //     category: "crypto",
  //   },
  //   {
  //     symbol: "SOL",
  //     description: "Solana",
  //     currency: "BTC",
  //     emoji: "◎",
  //     category: "crypto",
  //   },
  //   {
  //     symbol: "XRP",
  //     description: "XRP",
  //     currency: "BTC",
  //     emoji: "Ⓧ",
  //     category: "crypto",
  //   },
  //   {
  //     symbol: "DOGE",
  //     description: "Dogecoin",
  //     currency: "BTC",
  //     emoji: "🐶",
  //     category: "crypto",
  //   },
  //   {
  //     symbol: "ADA",
  //     description: "Cardano",
  //     currency: "BTC",
  //     emoji: "🌐",
  //     category: "crypto",
  //   },
  //   {
  //     symbol: "XMR",
  //     description: "Monero",
  //     currency: "BTC",
  //     emoji: "🔒",
  //     category: "crypto",
  //   },
  // ];

  const btcPriceData = await getPriceData(client, {
    symbol: "BTC",
    description: "Bitcoin",
    currency: "USD",
    emoji: "₿",
    category: "crypto",
  });

  const btcPrice: PriceData = {
    name: "Bitcoin",
    symbol: btcPriceData.symbol,
    value: btcPriceData.current.toString(),
    change: btcPriceData.change.toString(),
    category: "crypto",
  };

  // for (const ticker of crypto) {
  //   const priceData = await getPriceData(client, ticker);

  //   prices.push({
  //     name: ticker.description,
  //     symbol: priceData.symbol,
  //     value: priceData.current.toString(),
  //     change: priceData.change.toString(),
  //     category: "crypto",
  //   });
  // }

  return btcPrice;
}

async function getCurrency(client: TradingView.Client): Promise<PriceData[]> {
  const forex: Ticker[] = [
    {
      symbol: "TRY",
      description: "Türk Lirası",
      currency: "USD",
      emoji: "🇹🇷",
      category: "currency",
    },
    {
      symbol: "USD",
      description: "Amerikan Doları",
      currency: "sats",
      emoji: "💵",
      category: "currency",
    },
    {
      symbol: "EUR",
      description: "Avro",
      currency: "USD",
      emoji: "🇪🇺",
      category: "currency",
    },
    {
      symbol: "GBP",
      description: "İngiliz Sterlini",
      currency: "USD",
      emoji: "🇬🇧",
      category: "currency",
    },
  ];

  return Promise.all(
    forex.map(async (ticker) => {
      const priceData = await getPriceData(client, ticker);

      return {
        name: ticker.description,
        symbol: priceData.symbol,
        value: priceData.current.toString(),
        change: priceData.change.toString(),
        category: "currency",
      };
    }),
  );
}

async function getStocks(client: TradingView.Client): Promise<PriceData[]> {
  const prices: PriceData[] = [];

  const stocks: Ticker[] = [
    {
      symbol: "NVDA",
      description: "NVIDIA",
      currency: "USD",
      emoji: "🎮",
      category: "stock",
    },
    {
      symbol: "MSFT",
      description: "Microsoft",
      currency: "USD",
      emoji: "💻",
      category: "stock",
    },
    {
      symbol: "AAPL",
      description: "Apple",
      currency: "USD",
      emoji: "🍎",
      category: "stock",
    },
    {
      symbol: "GOOG",
      description: "Google",
      currency: "USD",
      emoji: "🔍",
      category: "stock",
    },
    {
      symbol: "AMZN",
      description: "Amazon",
      currency: "USD",
      emoji: "🛒",
      category: "stock",
    },
    {
      symbol: "META",
      description: "Meta",
      currency: "USD",
      emoji: "🤖",
      category: "stock",
    },
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

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${value}`);
}

function getSymbol(ticker: Ticker) {
  if (ticker.symbol === "USD") {
    return `(1 / BTCUSD) * 100000000`;
  }

  if (ticker.symbol === "BTC" && ticker.currency === "USD") {
    return `${ticker.symbol}USD`;
  }

  if (ticker.category === "stock") {
    return `${ticker.symbol}/BTCUSD`;
  }

  switch (ticker.currency) {
    case "BTC":
      return `${ticker.symbol}BTC`;
    case "USD":
      return `${ticker.symbol}USD/BTCUSD`;
    case "sats":
      throw new Error("Sats is only supported for USD");
    default:
      return assertNever(ticker.currency);
  }
}

type GetPriceDataResponse = {
  symbol: string;
  current: number;
  change: number;
};

function getPriceData(
  client: TradingView.Client,
  ticker: Ticker,
): Promise<GetPriceDataResponse> {
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

      const data: GetPriceDataResponse = {
        symbol,
        current: Number(current.toFixed(8)),
        change: Number(percentageChange.toFixed(2)),
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

type Ticker = {
  symbol: string;
  description: string;
  currency: "BTC" | "USD" | "sats";
  category: "crypto" | "currency" | "commodity" | "stock";
  emoji: string;
};
