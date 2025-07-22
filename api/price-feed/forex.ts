import { applyCacheHeaders } from "../cache-utils.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

import { ExchangeRateDataSchema, type CurrencyPriceData } from "./schemas.js";

// Vercel Edge Function handler for GET requests
export async function GET() {
  try {
    // Fetch forex rates from Exchange Rate API v6
    const apiResponse = await fetch(
      "https://v6.exchangerate-api.com/v6/294d7f389be61084e153bb50/latest/USD",
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!apiResponse.ok) {
      throw new Error(`Exchange Rate API error: ${apiResponse.status}`);
    }

    const rawForexData = await apiResponse.json();
    const forexData = ExchangeRateDataSchema.parse(rawForexData);

    if (forexData.result !== "success") {
      throw new Error("Exchange Rate API returned unsuccessful response");
    }

    // Prepare prices array
    const prices: CurrencyPriceData[] = [];

    // Add forex rates
    const forexRates = [
      { name: "Euro", symbol: "€", rate: forexData.conversion_rates.EUR },
      {
        name: "British Pound",
        symbol: "£",
        rate: forexData.conversion_rates.GBP,
      },
      {
        name: "Japanese Yen",
        symbol: "¥",
        rate: forexData.conversion_rates.JPY,
      },
      {
        name: "Swiss Franc",
        symbol: "₣",
        rate: forexData.conversion_rates.CHF,
      },
      {
        name: "Turkish Lira",
        symbol: "₺",
        rate: forexData.conversion_rates.TRY,
      },
      {
        name: "Canadian Dollar",
        symbol: "C$",
        rate: forexData.conversion_rates.CAD,
      },
      {
        name: "Australian Dollar",
        symbol: "A$",
        rate: forexData.conversion_rates.AUD,
      },
      {
        name: "Chinese Yuan",
        symbol: "¥",
        rate: forexData.conversion_rates.CNY,
      },
    ];

    forexRates.forEach(({ name, symbol, rate }) => {
      // For forex, we show the USD value of 1 unit of the currency
      const usdValue = 1 / rate;
      prices.push({
        name,
        symbol,
        value: usdValue.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }),
        change: "0.0%", // Forex doesn't provide 24h change in this API
        category: "currency",
        usdValue,
      });
    });

    const responseData = {
      prices,
      lastUpdated: new Date().toISOString(),
      source: "Exchange Rate API v6",
      totalAssets: prices.length,
    };

    const response = SuccessResponse(responseData);

    // Apply forex-specific caching strategy (15 minutes cache)
    return applyCacheHeaders(response, {
      maxAge: 900,
      staleWhileRevalidate: 180,
      cdnMaxAge: 900,
    });
  } catch (error) {
    console.error("Forex Price API error:", error);

    const errorResponse = ErrorResponse(
      error,
      "Failed to fetch forex price data",
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
