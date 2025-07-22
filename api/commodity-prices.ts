import { applyCacheHeaders } from "./cache-utils.js";
import { CoinGeckoPriceSchema, type CommodityPriceData } from "./schemas.js";
import { ErrorResponse, SuccessResponse } from "./utils.js";

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    // Fetch commodity prices from CoinGecko API
    const apiResponse = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=gold%2Csilver%2Coil%2Ccopper%2Cplatinum%2Cpalladium&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!apiResponse.ok) {
      throw new Error(`CoinGecko API error: ${apiResponse.status}`);
    }

    const rawCoinGeckoData = await apiResponse.json();
    const coinGeckoData = CoinGeckoPriceSchema.array().parse(rawCoinGeckoData);

    if (coinGeckoData.length === 0) {
      throw new Error("No commodity data received from CoinGecko");
    }

    // Prepare prices array
    const prices: CommodityPriceData[] = [];

    // Add commodities
    const commodities = [
      { id: "gold", name: "Gold", symbol: "🥇" },
      { id: "silver", name: "Silver", symbol: "🥈" },
      { id: "oil", name: "Oil", symbol: "🛢️" },
      { id: "copper", name: "Copper", symbol: "🔶" },
      { id: "platinum", name: "Platinum", symbol: "⚪" },
      { id: "palladium", name: "Palladium", symbol: "🔘" },
    ];

    commodities.forEach(({ id, name, symbol }) => {
      const commodity = coinGeckoData.find((item) => item.id === id);
      if (commodity) {
        prices.push({
          name,
          symbol,
          value: commodity.current_price.toLocaleString("en-US", {
            minimumFractionDigits:
              commodity.current_price < 1
                ? 4
                : commodity.current_price < 10
                  ? 2
                  : 0,
            maximumFractionDigits:
              commodity.current_price < 1
                ? 4
                : commodity.current_price < 10
                  ? 2
                  : 0,
          }),
          change: `${commodity.price_change_percentage_24h >= 0 ? "+" : ""}${commodity.price_change_percentage_24h.toFixed(1)}%`,
          category: "commodity",
          usdValue: commodity.current_price,
        });
      }
    });

    if (prices.length === 0) {
      throw new Error("No valid commodity data found");
    }

    const responseData = {
      prices,
      lastUpdated: new Date().toISOString(),
      source: "CoinGecko",
      totalAssets: prices.length,
    };

    const response = SuccessResponse(responseData);

    // Apply commodity-specific caching strategy (1 hour cache)
    return applyCacheHeaders(response, {
      maxAge: 3600,
      staleWhileRevalidate: 600,
      cdnMaxAge: 3600,
    });
  } catch (error) {
    console.error("Commodity Price API error:", error);

    const errorResponse = ErrorResponse(
      error,
      "Failed to fetch commodity price data",
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
