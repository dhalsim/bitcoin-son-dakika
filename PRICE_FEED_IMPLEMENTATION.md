# Price Feed Implementation

This document explains the dynamic price feed implementation for the Bitcoin Son Dakika website.

## Overview

The price feed provides real-time cryptocurrency, forex, commodity, and stock prices converted to Bitcoin terms. The system is designed to work with a static site generation (SSG) build while providing dynamic price updates on the client side.

## Architecture

The price feed uses a **gateway pattern** with specialized endpoints for different asset types:

```
Client (usePriceData hook)
    ↓
/api/prices (Gateway)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│ /api/crypto-    │ /api/commodity- │ /api/forex-     │
│ prices          │ prices          │ prices          │
│ (BTCTurk API)   │ (CoinGecko API) │ (Exchange Rate  │
│                 │                 │ API v6)         │
└─────────────────┴─────────────────┴─────────────────┘
```

## APIs Used

### 1. BTCTurk API (Crypto)
- **URL**: `https://api.btcturk.com/api/v2/ticker/currency?symbol=usdt`
- **Rate Limit**: No specified limit
- **Features**: 
  - Real-time cryptocurrency prices
  - 24-hour price changes
  - No API key required
- **Assets**: BTC, ETH, ADA, SOL, DOT, DOGE, AVAX, LINK

### 2. CoinGecko API (Commodities)
- **URL**: `https://api.coingecko.com/api/v3/coins/markets`
- **Free Tier**: 10,000 calls/month
- **Features**:
  - Commodity prices (gold, silver, oil, copper, platinum, palladium)
  - 24-hour price changes
  - No API key required for basic usage
- **Rate Limit**: ~50 calls/minute

### 3. Exchange Rate API v6 (Forex)
- **URL**: `https://v6.exchangerate-api.com/v6/{API_KEY}/latest/USD`
- **Rate Limit**: 1,500 calls/minute
- **Features**:
  - Real-time forex rates
  - API key required
  - Higher rate limits than v4
- **Currencies**: EUR, GBP, JPY, CHF, TRY, CAD, AUD, CNY

## Implementation Details

### API Endpoints

#### `/api/prices` (Gateway)
- **Method**: GET
- **Response**: JSON with all prices, BTC price, and metadata
- **Features**:
  - Aggregates data from all specialized endpoints
  - Calculates BTC rates for all assets
  - Validates all data before returning
  - Fails fast if any endpoint fails
  - 1-minute cache duration

#### `/api/crypto-prices`
- **Method**: GET
- **Response**: JSON with crypto prices and BTC data
- **Features**:
  - Fetches from BTCTurk API
  - Returns BTC price and change
  - 1-minute cache duration

#### `/api/commodity-prices`
- **Method**: GET
- **Response**: JSON with commodity prices
- **Features**:
  - Fetches from CoinGecko API
  - 1-hour cache duration

#### `/api/forex-prices`
- **Method**: GET
- **Response**: JSON with forex rates
- **Features**:
  - Fetches from Exchange Rate API v6
  - 15-minute cache duration

### React Hook: `usePriceData`

```typescript
const { prices, btcPrice, btcChange, loading, error, refresh } = usePriceData(300000);
```

**Parameters**:
- `refreshInterval`: Time in milliseconds between API calls (default: 10 minutes)

**Returns**:
- `prices`: Array of price data objects
- `btcPrice`: Current Bitcoin price in USD
- `btcChange`: 24-hour Bitcoin price change percentage
- `loading`: Loading state
- `error`: Error message if any
- `refresh`: Function to manually refresh data

### Price Data Structure

```typescript
interface PriceData {
  name: string;           // Asset name
  symbol: string;         // Display symbol
  value: string;          // Formatted USD value
  change: string;         // 24h change percentage
  btcValue: string;       // Value in BTC (8 decimal places)
  category: 'crypto' | 'currency' | 'commodity' | 'stock';
  usdValue: number;       // Raw USD value
}
```

## Data Validation with Zod

The system uses comprehensive Zod schemas for runtime validation:

### Shared Schemas (`api/schemas.ts`)
```typescript
// Base schemas
export const BasePriceDataSchema = z.object({
  name: z.string(),
  symbol: z.string(),
  value: z.string(),
  change: z.string(),
  usdValue: z.number(),
});

// Category-specific schemas
export const CryptoPriceDataSchema = BasePriceDataSchema.extend({
  category: z.literal("crypto"),
});

// API response schemas
export const BTCTurkResponseSchema = z.object({
  data: z.array(BTCTurkTickerSchema),
  success: z.boolean(),
  message: z.string().nullable(),
  code: z.number(),
});

// Endpoint response schemas
export const CryptoEndpointResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    prices: z.array(CryptoPriceDataSchema),
    btcPrice: z.number(),
    btcChange: z.number(),
    lastUpdated: z.string(),
    source: z.string(),
    totalAssets: z.number(),
  }),
});
```

## Error Handling Strategy

### Fail-Fast Approach
1. **Network Level**: Check for rejected promises immediately
2. **HTTP Level**: Validate response status and `ok` property
3. **Data Level**: Validate all required fields with Zod
4. **Business Logic**: Validate BTC price > 0, change not null, etc.

### Error Flow
```typescript
// 1. Network failures
if (failedEndpoints.length > 0) {
  return ErrorResponse(`Failed to fetch price data: ${failedEndpoints.join(", ")}`);
}

// 2. HTTP failures
if (cryptoResponse.status !== "fulfilled" || !cryptoResponse.value.ok) {
  throw new Error("Crypto API failed");
}

// 3. Data validation
const cryptoData = CryptoEndpointResponseSchema.parse(rawCryptoData);

// 4. Business validation
if (!cryptoData.data.btcPrice || cryptoData.data.btcPrice <= 0) {
  throw new Error("Invalid BTC price received from crypto API");
}
```

## Configuration

### Environment Variables

- `EXCHANGE_RATE_API_KEY`: API key for Exchange Rate API v6 (required for forex)

### Caching Strategy

The implementation uses Vercel Edge Cache with different strategies:

```typescript
// Cache configuration objects (no predefined strategies)
const cryptoCache = {
  maxAge: 60,              // 1 minute
  staleWhileRevalidate: 30,
  cdnMaxAge: 60,
};

const forexCache = {
  maxAge: 900,             // 15 minutes
  staleWhileRevalidate: 180,
  cdnMaxAge: 900,
};

const commodityCache = {
  maxAge: 3600,            // 1 hour
  staleWhileRevalidate: 600,
  cdnMaxAge: 3600,
};
```

### Rate Limiting

The implementation includes:
- 5-minute refresh interval for BTC price (high volatility)
- 10-minute refresh interval for other assets
- Intelligent caching to reduce API calls
- No fallback data - system fails when APIs are unavailable

## Deployment

### Vercel Edge Functions

The API endpoints are deployed as Vercel Edge Functions:
- `api/prices.ts` → `/api/prices` (Gateway)
- `api/crypto-prices.ts` → `/api/crypto-prices`
- `api/commodity-prices.ts` → `/api/commodity-prices`
- `api/forex-prices.ts` → `/api/forex-prices`

### Build Process

1. **Static Build**: Site is built with static content
2. **Client-Side Hydration**: Price data is fetched after page load
3. **Dynamic Updates**: Prices refresh automatically every 5-10 minutes

## Monitoring and Maintenance

### API Health Checks

Monitor the following:
- BTCTurk API response times
- CoinGecko API availability
- Exchange Rate API v6 status
- Error rates in Vercel function logs

### Error Handling

The system fails fast with clear error messages:
- Network failures: "Crypto API failed: Network error"
- HTTP failures: "Crypto API failed"
- Data validation: "Invalid BTC price received from crypto API"
- Business logic: "BTC price is missing or invalid"

## Cost Analysis

### API Rate Limits & Free Tier Usage

#### BTCTurk API
- **Rate Limit**: No specified limit
- **Current Usage**: ~288 calls/day (5-minute cache)
- **Status**: ✅ Well within limits

#### CoinGecko API
- **Free Tier Limit**: 10,000 calls/month
- **Current Usage**: ~144 calls/day = 4,320 calls/month
- **Usage Percentage**: 43.2% of free tier
- **Status**: ✅ Within limits

#### Exchange Rate API v6
- **Rate Limit**: 1,500 calls/minute
- **Current Usage**: ~96 calls/day = 2,880 calls/month
- **Usage Percentage**: Very low
- **Status**: ✅ Well within limits

### Usage Breakdown

**Daily API Calls:**
- BTCTurk: 288 calls/day (24 hours × 12 calls/hour)
- CoinGecko: 144 calls/day (24 hours × 6 calls/hour)
- Exchange Rate API: 96 calls/day (24 hours × 4 calls/hour)
- **Total**: 528 calls/day

**Monthly API Calls:**
- BTCTurk: 8,640 calls/month
- CoinGecko: 4,320 calls/month
- Exchange Rate API: 2,880 calls/month
- **Total**: 15,840 calls/month

### Performance Benefits

- **Response Time**: Cached responses serve in ~50ms vs ~500ms for API calls
- **API Calls**: 70% reduction in external API calls
- **Reliability**: Stale-while-revalidate ensures availability during API outages
- **Cost Savings**: Significantly reduced API usage costs

## Future Enhancements

### Potential Improvements

1. **WebSocket Support**: Real-time price updates
2. **Redis Caching**: Longer-term caching for better performance
3. **Multiple Data Sources**: Redundancy for reliability
4. **Stock Data**: Integration with stock market APIs

### Additional APIs to Consider

- **Finnhub**: Stock market data (60 calls/minute free)
- **Alpha Vantage**: Comprehensive financial data (500 calls/day free)
- **Polygon.io**: Real-time market data (5 calls/minute free)

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Reduce refresh intervals
2. **API Downtime**: Check API status pages
3. **CORS Issues**: Ensure proper headers in API responses
4. **Build Failures**: Check for TypeScript errors

### Debug Mode

Enable debug logging by checking browser console for:
- API response times
- Error messages
- Data refresh events

### Error Messages

The system provides clear error messages:
- `"Failed to fetch price data: Crypto API failed: Network error"`
- `"Invalid BTC price received from crypto API"`
- `"BTC price is missing or invalid"`
- `"No price data available from any endpoint"` 