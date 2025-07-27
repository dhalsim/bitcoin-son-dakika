import TradingView from "@mathieuc/tradingview";
import { createClient } from "redis";

import { applyCacheHeaders } from "../cache-utils.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

import { type FinalPriceData } from "./schemas.js";

const redis = await createClient().connect();

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

    const prices: FinalPriceData[] = [];

    for (const symbol of ["XAUUSD", "XAGUSD", "XCUUSD", "XPDUSD", "XPTUSD"]) {
      const priceData = await getPriceData(client, symbol);

      prices.push({
        name: priceData.description,
        symbol: priceData.symbol,
        value: priceData.current.toString(),
        change: priceData.previous.toString(),
        category: "commodity",
        usdValue: priceData.current,
        btcValue: priceData.previous.toString(),
      });

      console.log(prices);
    }

    // Create response following the existing pattern
    const response = SuccessResponse({
      success: true,
      message: "New price feed data retrieved successfully",
      prices,
      timestamp: Date.now(),
    });

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

type PriceData = {
  symbol: string;
  current: number;
  previous: number;
  currency: string;
  description: string;
};

async function getPriceData(
  client: TradingView.Client,
  symbol: string,
): Promise<PriceData> {
  return new Promise((resolve, reject) => {
    const chart = new client.Session.Chart();

    chart.setMarket(`${symbol}/BTCUSD`, {
      timeframe: "D",
      range: 2,
    });

    chart.on("update", () => {
      const data: PriceData = {
        symbol: `${symbol}/BTCUSD`,
        current: chart.periods[0].close,
        previous: chart.periods[1]
          ? chart.periods[1].close
          : chart.periods[0].close,
        currency: chart.infos.currency_id,
        description: chart.infos.description,
      };

      resolve(data);

      cleanup();
    });

    chart.on("error", (...error) => {
      reject(new Error(`Chart error for ${symbol}: ${error.join(" ")}`));

      cleanup();
    });

    function cleanup() {
      chart.delete();
    }
  });
}
