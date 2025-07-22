/**
 * Cache utilities for Vercel Edge Functions
 * Implements different caching strategies based on data type and volatility
 */

export interface CacheConfig {
  maxAge: number; // Primary cache duration in seconds
  staleWhileRevalidate: number; // How long to serve stale content while revalidating
  cdnMaxAge?: number; // CDN-specific cache duration
}

/**
 * Apply cache headers to a Response object
 */
export function applyCacheHeaders(
  response: Response,
  strategy: CacheConfig,
): Response {
  const cacheControl = `s-maxage=${strategy.maxAge}, stale-while-revalidate=${strategy.staleWhileRevalidate}`;

  response.headers.set("Cache-Control", cacheControl);
  response.headers.set(
    "CDN-Cache-Control",
    `s-maxage=${strategy.cdnMaxAge || strategy.maxAge}`,
  );

  // Add ETag for better cache validation
  const etag = `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
  response.headers.set("ETag", etag);

  return response;
}

/**
 * Create a cache-aware response with appropriate headers
 */
export function createCachedResponse(
  data: any,
  strategy: CacheConfig,
): Response {
  const response = new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });

  return applyCacheHeaders(response, strategy);
}

/**
 * Check if request has valid cache headers
 */
export function hasValidCache(request: Request): boolean {
  const ifNoneMatch = request.headers.get("if-none-match");
  const ifModifiedSince = request.headers.get("if-modified-since");

  return !!(ifNoneMatch || ifModifiedSince);
}

/**
 * Return 304 Not Modified response for cached content
 */
export function createNotModifiedResponse(etag: string): Response {
  return new Response(null, {
    status: 304,
    headers: {
      ETag: etag,
      "Cache-Control": "s-maxage=300, stale-while-revalidate=60",
    },
  });
}
