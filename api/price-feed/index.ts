import TradingView from "@mathieuc/tradingview";
import { createClient } from "redis";

import { applyCacheHeaders } from "../cache-utils.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

import { getCommodities } from "./commodities.js";
import { getCrypto } from "./crypto.js";
import { getCurrency } from "./currency.js";
import type { BaseEndpointResponse } from "./schemas.js";
import { type PriceData } from "./schemas.js";
import { getStocks } from "./stocks.js";

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
