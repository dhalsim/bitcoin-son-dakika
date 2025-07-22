import { applyCacheHeaders } from "./cache-utils.js";
import {
  BTCTurkResponseSchema,
  type BTCTurkTicker,
  type CryptoPriceData,
} from "./schemas.js";
import { ErrorResponse, SuccessResponse } from "./utils.js";

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    // Fetch crypto prices from BTCTurk API (all USDT pairs)
    const apiResponse = await fetch(
      "https://api.btcturk.com/api/v2/ticker/currency?symbol=usdt",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!apiResponse.ok) {
      throw new Error(`BTCTurk API error: ${apiResponse.status}`);
    }

    const rawBtcturkResponse = await apiResponse.json();
    const btcturkResponse = BTCTurkResponseSchema.parse(rawBtcturkResponse);

    if (!btcturkResponse.success || !btcturkResponse.data) {
      throw new Error("BTCTurk API returned unsuccessful response");
    }

    // Create a map for easy lookup
    const tickerMap = new Map<string, BTCTurkTicker>();
    btcturkResponse.data.forEach((ticker) => {
      tickerMap.set(ticker.pair, ticker);
    });

    // Get BTC price as reference
    const btcTicker = tickerMap.get("BTCUSDT");
    if (!btcTicker) {
      throw new Error("BTC price not found in response");
    }

    const btcPrice = btcTicker.last;
    const btcChange = btcTicker.dailyPercent;

    // Prepare prices array
    const prices: CryptoPriceData[] = [
      // Bitcoin (reference)
      {
        name: "Bitcoin",
        symbol: "₿",
        value: btcPrice.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
        change: `${btcChange >= 0 ? "+" : ""}${btcChange.toFixed(1)}%`,
        category: "crypto",
        usdValue: btcPrice,
      },
    ];

    // Add other cryptocurrencies
    const cryptoPairs = [
      { pair: "ETHUSDT", name: "Ethereum", symbol: "Ξ" },
      { pair: "ADAUSDT", name: "Cardano", symbol: "₳" },
      { pair: "SOLUSDT", name: "Solana", symbol: "◎" },
      { pair: "DOTUSDT", name: "Polkadot", symbol: "●" },
      { pair: "DOGEUSDT", name: "Dogecoin", symbol: "Ð" },
      { pair: "AVAXUSDT", name: "Avalanche", symbol: "❄" },
      { pair: "LINKUSDT", name: "Chainlink", symbol: "🔗" },
    ];

    cryptoPairs.forEach(({ pair, name, symbol }) => {
      const ticker = tickerMap.get(pair);
      if (ticker) {
        prices.push({
          name,
          symbol,
          value: ticker.last.toLocaleString("en-US", {
            minimumFractionDigits:
              ticker.last < 1 ? 4 : ticker.last < 10 ? 2 : 0,
            maximumFractionDigits:
              ticker.last < 1 ? 4 : ticker.last < 10 ? 2 : 0,
          }),
          change: `${ticker.dailyPercent >= 0 ? "+" : ""}${ticker.dailyPercent.toFixed(1)}%`,
          category: "crypto",
          usdValue: ticker.last,
        });
      }
    });

    // Validate the response structure
    const responseData = {
      prices,
      btcPrice,
      btcChange,
      lastUpdated: new Date().toISOString(),
      source: "BTCTurk",
      totalAssets: prices.length,
    };

    const response = SuccessResponse(responseData);

    // Apply crypto-specific caching strategy (1 minute cache)
    return applyCacheHeaders(response, {
      maxAge: 60,
      staleWhileRevalidate: 30,
      cdnMaxAge: 60,
    });
  } catch (error) {
    console.error("Crypto Price API error:", error);

    const errorResponse = ErrorResponse(
      error,
      "Failed to fetch crypto price data",
      500,
    );

    // Apply error caching strategy
    return applyCacheHeaders(errorResponse, {
      maxAge: 60,
      staleWhileRevalidate: 30,
      cdnMaxAge: 60,
    });
  }
}

// Vercel Edge Function handler for OPTIONS requests (CORS)
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
