import TradingView from "@mathieuc/tradingview";

import { getRedis } from "../../api-helpers/common.js";
import {
  applyCacheHeaders,
  ErrorResponseCreator,
  SuccessResponse,
} from "../../api-helpers/common_with_client.js";
import { type BaseEndpointResponse, type PriceData } from "../../src/types/api.js";

// Vercel Edge Function handler for GET requests
export async function GET() {
  if (!process.env.TRADINGVIEW_USERNAME || !process.env.TRADINGVIEW_PASSWORD) {
    return ErrorResponseCreator("TradingView credentials are not set", 500);
  }

  try {
    const redis = await getRedis();

    let session = await redis.get("session");
    let signature = await redis.get("signature");

    if (!session || !signature) {
      const user = await TradingView.loginUser(
        process.env.TRADINGVIEW_USERNAME,
        process.env.TRADINGVIEW_PASSWORD,
        false,
      );

      session = user.session;
      signature = user.signature;

      await redis.set("session", user.session);
      await redis.set("signature", user.signature);
    }

    const client = new TradingView.Client({
      token: session,
      signature: signature,
    });

    const [currency, btcPrice, commodities, stocks] = await Promise.all([
      getCurrency(client),
      getBitcoin(client),
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
    const err = error instanceof Error ? error : new Error("Failed to fetch new price feed data");

    console.error("New Price Feed API error:", err);

    const errorResponse = ErrorResponseCreator(err, 500);

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

async function getCommodities(client: TradingView.Client): Promise<PriceData[]> {
  const commodities: Ticker[] = [
    {
      symbol: "XAU",
      priceSymbol: "XAUBTC",
      description: "Altın",
      currency: "BTC",
      emoji: "🥇",
      category: "commodity",
    },
    {
      symbol: "XAG",
      priceSymbol: "XAGBTC",
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
        symbol: ticker.symbol,
        priceSymbol: ticker.priceSymbol,
        emoji: ticker.emoji,
        currency: ticker.currency,
        value: priceData.current.toString(),
        change: priceData.change.toString(),
        category: "commodity",
      };
    }),
  );
}

async function getBitcoin(client: TradingView.Client): Promise<PriceData> {
  const btcPriceData = await getPriceData(client, {
    symbol: "BTC",
    priceSymbol: "BTCUSD",
    description: "Bitcoin",
    currency: "USD",
    emoji: "₿",
    category: "crypto",
  });

  const btcPrice: PriceData = {
    name: "Bitcoin",
    symbol: "BTC",
    priceSymbol: "BTCUSD",
    emoji: "₿",
    currency: "USD",
    value: btcPriceData.current.toString(),
    change: btcPriceData.change.toString(),
    category: "crypto",
  };

  return btcPrice;
}

async function getCurrency(client: TradingView.Client): Promise<PriceData[]> {
  const forex: Ticker[] = [
    {
      symbol: "TRY",
      priceSymbol: "TRYUSD/BTCUSD * 100000000",
      description: "Türk Lirası",
      currency: "sats",
      emoji: "🇹🇷",
      category: "currency",
    },
    {
      symbol: "USD",
      priceSymbol: "1/BTCUSD * 100000000",
      description: "Amerikan Doları",
      currency: "sats",
      emoji: "💵",
      category: "currency",
    },
    {
      symbol: "EUR",
      priceSymbol: "EURUSD/BTCUSD * 100000000",
      description: "Avro",
      currency: "sats",
      emoji: "🇪🇺",
      category: "currency",
    },
    {
      symbol: "GBP",
      priceSymbol: "GBPUSD/BTCUSD * 100000000",
      description: "İngiliz Sterlini",
      currency: "sats",
      emoji: "🇬🇧",
      category: "currency",
    },
  ];

  return Promise.all(
    forex.map(async (ticker) => {
      const priceData = await getPriceData(client, ticker);

      return {
        name: ticker.description,
        symbol: ticker.symbol,
        priceSymbol: ticker.priceSymbol,
        emoji: ticker.emoji,
        currency: ticker.currency,
        value: priceData.current.toString(),
        change: priceData.change.toString(),
        category: "currency",
      };
    }),
  );
}

async function getStocks(client: TradingView.Client): Promise<PriceData[]> {
  const stocks: Ticker[] = [
    {
      symbol: "NVDA",
      priceSymbol: "NVDA/BTCUSD",
      description: "NVIDIA",
      currency: "USD",
      emoji: "🎮",
      category: "stock",
    },
    {
      symbol: "MSFT",
      priceSymbol: "MSFT/BTCUSD",
      description: "Microsoft",
      currency: "USD",
      emoji: "💻",
      category: "stock",
    },
    {
      symbol: "AAPL",
      priceSymbol: "AAPL/BTCUSD",
      description: "Apple",
      currency: "USD",
      emoji: "🍎",
      category: "stock",
    },
    {
      symbol: "GOOG",
      priceSymbol: "GOOG/BTCUSD",
      description: "Google",
      currency: "USD",
      emoji: "🔍",
      category: "stock",
    },
    {
      symbol: "AMZN",
      priceSymbol: "AMZN/BTCUSD",
      description: "Amazon",
      currency: "USD",
      emoji: "🛒",
      category: "stock",
    },
    {
      symbol: "META",
      priceSymbol: "META/BTCUSD",
      description: "Meta",
      currency: "USD",
      emoji: "🤖",
      category: "stock",
    },
  ];

  return Promise.all(
    stocks.map(async (ticker) => {
      const priceData = await getPriceData(client, ticker);

      return {
        name: ticker.description,
        symbol: ticker.symbol,
        priceSymbol: ticker.priceSymbol,
        emoji: ticker.emoji,
        currency: ticker.currency,
        value: priceData.current.toString(),
        change: priceData.change.toString(),
        category: "stock",
      };
    }),
  );
}

type GetPriceDataResponse = {
  current: number;
  change: number;
};

function getPriceData(client: TradingView.Client, ticker: Ticker): Promise<GetPriceDataResponse> {
  return new Promise((resolve, reject) => {
    const chart = new client.Session.Chart();

    chart.setMarket(ticker.priceSymbol, {
      timeframe: "D",
      range: 2,
    });

    chart.onUpdate(() => {
      const current = chart.periods[0].close;
      const previous = chart.periods[1].close;

      const percentageChange = ((current - previous) / previous) * 100;

      const data: GetPriceDataResponse = {
        current:
          ticker.currency === "sats" ? Number(current.toFixed(0)) : Number(current.toFixed(8)),
        change: Number(percentageChange.toFixed(2)),
      };

      resolve(data);

      cleanup();
    });

    chart.onError((...error: unknown[]) => {
      reject(
        new Error(
          `Chart error for ${ticker.symbol}, ${ticker.priceSymbol}: ${error.map(String).join(" ")}`,
        ),
      );

      cleanup();
    });

    function cleanup() {
      chart.delete();
    }
  });
}

type Ticker = {
  symbol: string;
  priceSymbol: string;
  description: string;
  currency: "BTC" | "USD" | "sats";
  category: "crypto" | "currency" | "commodity" | "stock";
  emoji: string;
};
