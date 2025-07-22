import { WEBSITE_URL } from "../src/lib/constants.js";

import { applyCacheHeaders } from "./cache-utils.js";
import {
  CryptoEndpointResponseSchema,
  CommodityEndpointResponseSchema,
  ForexEndpointResponseSchema,
  type FinalPriceData,
} from "./schemas.js";
import { ErrorResponse, SuccessResponse } from "./utils.js";

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    // Fetch data from all three endpoints in parallel
    const [cryptoResponse, commodityResponse, forexResponse] =
      await Promise.allSettled([
        fetch(`${WEBSITE_URL}/api/crypto-prices`),
        fetch(`${WEBSITE_URL}/api/commodity-prices`),
        fetch(`${WEBSITE_URL}/api/forex-prices`),
      ]);

    // Check if any endpoint failed and return error immediately
    const failedEndpoints: string[] = [];

    if (cryptoResponse.status === "rejected") {
      failedEndpoints.push("Crypto API failed: " + cryptoResponse.reason);
    }

    if (commodityResponse.status === "rejected") {
      failedEndpoints.push("Commodity API failed: " + commodityResponse.reason);
    }

    if (forexResponse.status === "rejected") {
      failedEndpoints.push("Forex API failed: " + forexResponse.reason);
    }

    if (failedEndpoints.length > 0) {
      const errorMessage = `Failed to fetch price data: ${failedEndpoints.join(", ")}`;
      console.error("Price Gateway API error:", errorMessage);

      const errorResponse = ErrorResponse(
        new Error(errorMessage),
        "Failed to fetch aggregated price data",
        500,
      );

      return applyCacheHeaders(errorResponse, {
        maxAge: 60,
        staleWhileRevalidate: 30,
        cdnMaxAge: 60,
      });
    }

    if (cryptoResponse.status !== "fulfilled" || !cryptoResponse.value.ok) {
      throw new Error("Crypto API failed");
    }

    if (
      commodityResponse.status !== "fulfilled" ||
      !commodityResponse.value.ok
    ) {
      throw new Error("Commodity API failed");
    }

    if (forexResponse.status !== "fulfilled" || !forexResponse.value.ok) {
      throw new Error("Forex API failed");
    }

    const allPrices: FinalPriceData[] = [];

    // Process crypto data
    const rawCryptoData = await cryptoResponse.value.json();
    const cryptoData = CryptoEndpointResponseSchema.parse(rawCryptoData);

    // Add BTC rates to crypto prices
    cryptoData.data.prices.forEach((price) => {
      allPrices.push({
        ...price,
        btcValue:
          price.category === "crypto" && price.name === "Bitcoin"
            ? "1.00000000"
            : (price.usdValue / cryptoData.data.btcPrice).toFixed(8),
      });
    });

    const btcPrice = cryptoData.data.btcPrice;
    const btcChange = cryptoData.data.btcChange;

    // Process commodity data
    const rawCommodityData = await commodityResponse.value.json();
    const commodityData =
      CommodityEndpointResponseSchema.parse(rawCommodityData);

    // Add BTC rates to commodity prices
    commodityData.data.prices.forEach((price) => {
      allPrices.push({
        ...price,
        btcValue: (price.usdValue / btcPrice).toFixed(8),
      });
    });

    // Process forex data
    const rawForexData = await forexResponse.value.json();
    const forexData = ForexEndpointResponseSchema.parse(rawForexData);

    // Add BTC rates to forex prices
    forexData.data.prices.forEach((price) => {
      allPrices.push({
        ...price,
        btcValue: (price.usdValue / btcPrice).toFixed(8),
      });
    });

    // Validate that we have all required data
    if (!btcPrice || btcPrice <= 0) {
      throw new Error("BTC price is missing or invalid");
    }

    if (btcChange === null || btcChange === undefined) {
      throw new Error("BTC change is missing or invalid");
    }

    if (allPrices.length === 0) {
      throw new Error("No price data available from any endpoint");
    }

    const response = SuccessResponse({
      prices: allPrices,
      btcPrice,
      btcChange,
      lastUpdated: new Date().toISOString(),
      totalAssets: allPrices.length,
    });

    // Apply minimal caching for the gateway (1 minute)
    return applyCacheHeaders(response, {
      maxAge: 60,
      staleWhileRevalidate: 30,
      cdnMaxAge: 60,
    });
  } catch (error) {
    console.error("Price Gateway API error:", error);

    const errorResponse = ErrorResponse(
      error,
      "Failed to fetch aggregated price data",
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
