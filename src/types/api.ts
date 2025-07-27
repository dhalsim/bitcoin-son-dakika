import { z } from "zod";

// Base price data schema that can be extended for different categories
export const PriceDataSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  value: z.string(),
  change: z.string(),
  category: z.enum(["crypto", "currency", "commodity", "stock"]),
});

// Endpoint response schemas
export const BaseEndpointResponseSchema = z.object({
  success: z.boolean(),
  prices: z.array(PriceDataSchema),
  btcPrice: z.string(),
  btcChange: z.string(),
  lastUpdated: z.string(),
  source: z.string(),
  totalAssets: z.number(),
});

// Type exports for convenience

export type PriceData = z.infer<typeof PriceDataSchema>;
export type BaseEndpointResponse = z.infer<typeof BaseEndpointResponseSchema>;
