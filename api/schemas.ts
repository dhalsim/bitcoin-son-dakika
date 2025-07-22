import { z } from "zod";

// Base price data schema that can be extended for different categories
export const BasePriceDataSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  value: z.string(),
  change: z.string(),
  usdValue: z.number(),
});

// Category-specific price data schemas
export const CryptoPriceDataSchema = BasePriceDataSchema.extend({
  category: z.literal("crypto"),
});

export const CommodityPriceDataSchema = BasePriceDataSchema.extend({
  category: z.literal("commodity"),
});

export const CurrencyPriceDataSchema = BasePriceDataSchema.extend({
  category: z.literal("currency"),
});

export const StockPriceDataSchema = BasePriceDataSchema.extend({
  category: z.literal("stock"),
});

// Union type for all price data
export const PriceDataSchema = z.discriminatedUnion("category", [
  CryptoPriceDataSchema,
  CommodityPriceDataSchema,
  CurrencyPriceDataSchema,
  StockPriceDataSchema,
]);

// BTCTurk API schemas
export const BTCTurkTickerSchema = z.object({
  pair: z.string(),
  pairNormalized: z.string(),
  timestamp: z.number(),
  last: z.number(),
  high: z.number(),
  low: z.number(),
  bid: z.number(),
  ask: z.number(),
  open: z.number(),
  volume: z.number(),
  average: z.number(),
  daily: z.number(),
  dailyPercent: z.number(),
  denominatorSymbol: z.string(),
  numeratorSymbol: z.string(),
  order: z.number(),
});

export const BTCTurkResponseSchema = z.object({
  data: z.array(BTCTurkTickerSchema),
  success: z.boolean(),
  message: z.string().nullable(),
  code: z.number(),
});

// CoinGecko API schemas
export const CoinGeckoPriceSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: z.number(),
  price_change_percentage_24h: z.number(),
});

// Exchange Rate API schemas
export const ExchangeRateDataSchema = z.object({
  result: z.string(),
  documentation: z.string(),
  terms_of_use: z.string(),
  time_last_update_unix: z.number(),
  time_last_update_utc: z.string(),
  time_next_update_unix: z.number(),
  time_next_update_utc: z.string(),
  base_code: z.string(),
  conversion_rates: z
    .object({
      EUR: z.number(),
      GBP: z.number(),
      JPY: z.number(),
      CHF: z.number(),
      TRY: z.number(),
      CAD: z.number(),
      AUD: z.number(),
      CNY: z.number(),
    })
    .and(z.record(z.string(), z.number())),
});

// Endpoint response schemas
export const BaseEndpointResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    prices: z.array(BasePriceDataSchema),
    lastUpdated: z.string(),
    source: z.string(),
    totalAssets: z.number(),
  }),
});

export const CryptoEndpointResponseSchema = BaseEndpointResponseSchema.extend({
  data: z.object({
    prices: z.array(CryptoPriceDataSchema),
    btcPrice: z.number(),
    btcChange: z.number(),
    lastUpdated: z.string(),
    source: z.string(),
    totalAssets: z.number(),
  }),
});

export const CommodityEndpointResponseSchema =
  BaseEndpointResponseSchema.extend({
    data: z.object({
      prices: z.array(CommodityPriceDataSchema),
      lastUpdated: z.string(),
      source: z.string(),
      totalAssets: z.number(),
    }),
  });

export const ForexEndpointResponseSchema = BaseEndpointResponseSchema.extend({
  data: z.object({
    prices: z.array(CurrencyPriceDataSchema),
    lastUpdated: z.string(),
    source: z.string(),
    totalAssets: z.number(),
  }),
});

// Final price data with BTC value (used in main gateway)
export const FinalPriceDataSchema = BasePriceDataSchema.extend({
  btcValue: z.string(),
  category: z.enum(["crypto", "currency", "commodity", "stock"]),
});

// Type exports for convenience
export type BasePriceData = z.infer<typeof BasePriceDataSchema>;
export type CryptoPriceData = z.infer<typeof CryptoPriceDataSchema>;
export type CommodityPriceData = z.infer<typeof CommodityPriceDataSchema>;
export type CurrencyPriceData = z.infer<typeof CurrencyPriceDataSchema>;
export type StockPriceData = z.infer<typeof StockPriceDataSchema>;
export type PriceData = z.infer<typeof PriceDataSchema>;
export type FinalPriceData = z.infer<typeof FinalPriceDataSchema>;
export type BTCTurkTicker = z.infer<typeof BTCTurkTickerSchema>;
export type BTCTurkResponse = z.infer<typeof BTCTurkResponseSchema>;
export type CoinGeckoPrice = z.infer<typeof CoinGeckoPriceSchema>;
export type ExchangeRateData = z.infer<typeof ExchangeRateDataSchema>;
