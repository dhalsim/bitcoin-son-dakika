import TradingView from "@mathieuc/tradingview";
import { createClient } from "redis";

import {
  type BaseEndpointResponse,
  type PriceData,
} from "../../src/types/api.js";
import { applyCacheHeaders } from "../cache-utils.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

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

    const [btcPrice, crypto] = await getCrypto(client);
    const commodities = await getCommodities(client);
    const currency = await getCurrency(client);
    const stocks = await getStocks(client);

    const prices: PriceData[] = [
      ...crypto,
      ...commodities,
      ...currency,
      ...stocks,
    ];

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

async function getCrypto(
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

async function getCurrency(client: TradingView.Client): Promise<PriceData[]> {
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

async function getStocks(client: TradingView.Client): Promise<PriceData[]> {
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

type Ticker = {
  symbol: string;
  description: string;
  currency: "BTC" | "USD";
  emoji: string;
};
