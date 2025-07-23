import { WEBSITE_URL } from "../../src/lib/constants.js";
import { applyCacheHeaders } from "../cache-utils.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

import { BitcoinStatsDataSchema } from "./schemas.js";

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    // Fetch data from mempool endpoint
    const mempoolResponse = await fetch(
      `${WEBSITE_URL}/api/bitcoin-stats/mempool`,
    );

    if (!mempoolResponse.ok) {
      throw new Error(`Mempool API failed: ${mempoolResponse.status}`);
    }

    const rawMempoolData = await mempoolResponse.json();

    // Check if the response indicates an error
    if (!rawMempoolData.success) {
      throw new Error(
        `Mempool API error: ${rawMempoolData.message || "Unknown error"}`,
      );
    }

    // Validate the response structure
    const bitcoinStatsData = BitcoinStatsDataSchema.parse(rawMempoolData.data);

    const response = SuccessResponse({
      ...bitcoinStatsData,
      lastUpdated: new Date().toISOString(),
    });

    // Apply Bitcoin stats gateway caching strategy (2 minutes cache)
    return applyCacheHeaders(response, {
      maxAge: 120,
      staleWhileRevalidate: 60,
      cdnMaxAge: 120,
    });
  } catch (error) {
    console.error("Bitcoin Stats Gateway API error:", error);

    const errorResponse = ErrorResponse(
      error,
      "Failed to fetch Bitcoin statistics",
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
