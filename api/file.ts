import {
  getBadServerKey,
  getLastGoodKey,
  getCachedServersKey,
  getBlurHashKey,
} from "../api-helpers/admin/blossom/common.js";
import { getBlossomServersEvent, getRedis } from "../api-helpers/utils.js";

// Extract sha256 from URL path (last 64-char hex string)
function extractSha256FromPath(pathname: string): string | null {
  const matches = pathname.match(/[a-f0-9]{64}/gi);

  return matches ? matches[matches.length - 1] : null;
}

// Get server list in priority order
async function getServerList(sha256: string): Promise<string[]> {
  const redis = await getRedis();

  // 1. Try last-good server first
  const lastGood = await redis.get(getLastGoodKey(sha256));

  if (lastGood) {
    return [lastGood];
  }

  // 2. Try user's server list from Nostr
  try {
    const serverEvent = await getBlossomServersEvent();

    if (serverEvent && serverEvent.tags) {
      const userServers = serverEvent.tags
        .filter((tag) => tag[0] === "server")
        .map((tag) => tag[1])
        .filter(Boolean);

      if (userServers.length > 0) {
        return userServers;
      }
    }
  } catch (error) {
    console.warn("Failed to get user server list:", error);
  }

  // 3. Fallback to cached servers
  const cachedServers = await redis.get(getCachedServersKey());
  if (cachedServers) {
    try {
      const servers = JSON.parse(cachedServers);
      if (Array.isArray(servers) && servers.length > 0) {
        return servers;
      }
    } catch (error) {
      console.warn("Failed to parse cached servers:", error);
    }
  }

  // 4. No servers available
  return [];
}

// Check if server is marked as bad for this blob
async function isServerBad(sha256: string, server: string): Promise<boolean> {
  const badKey = getBadServerKey(sha256, server);

  return (await redis.exists(badKey)) > 0;
}

// Mark server as bad for this blob
async function markServerBad(
  sha256: string,
  server: string,
  ttlSeconds: number = 900,
): Promise<void> {
  const badKey = getBadServerKey(sha256, server);
  await redis.set(badKey, "1", { expiration: { type: "EX", value: ttlSeconds } });
}

// Mark server as good for this blob
async function markServerGood(sha256: string, server: string): Promise<void> {
  const lastGoodKey = getLastGoodKey(sha256);
  const _24hoursInSeconds = 60 * 60 * 24;
  await redis.set(lastGoodKey, server, { expiration: { type: "EX", value: _24hoursInSeconds } }); // 24h TTL

  // Clear bad flag
  const badKey = getBadServerKey(sha256, server);
  await redis.del(badKey);
}

// Get BlurHash metadata from Redis
async function getBlurHashMetadata(
  sha256: string,
): Promise<{ blurhash: string; width: number; height: number; contentType: string } | null> {
  const metadata = await redis.get(getBlurHashKey(sha256));

  return metadata ? JSON.parse(metadata) : null;
}

// Fetch blob from a single server
async function fetchFromServer(
  server: string,
  sha256: string,
  method: "GET" | "HEAD",
  headers: Headers,
): Promise<Response | null> {
  const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;
  const url = `${serverUrl}/${sha256}`;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        // Forward relevant headers
        Range: headers.get("Range") || "",
        "If-None-Match": headers.get("If-None-Match") || "",
        "If-Modified-Since": headers.get("If-Modified-Since") || "",
      },
    });

    // Check if redirect contains the same sha256
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      if (location && location.includes(sha256)) {
        return response; // Valid redirect
      }
    }

    return response;
  } catch (error) {
    console.warn(`Failed to fetch from ${server}:`, error);

    return null;
  }
}

// Main handler for GET requests
export async function GET(request: Request) {
  const url = new URL(request.url);

  // Extract sha256 from path
  const sha256 = extractSha256FromPath(url.pathname);

  if (!sha256 || sha256.length !== 64) {
    return new Response("Invalid hash", { status: 400 });
  }

  try {
    const servers = await getServerList(sha256);

    let lastError: string = "";

    for (const server of servers) {
      // Skip if server is marked as bad
      if (await isServerBad(sha256, server)) {
        continue;
      }

      const response = await fetchFromServer(server, sha256, "GET", request.headers);

      if (response && response.ok) {
        // Success - mark server as good
        await markServerGood(sha256, server);

        // Create response with proper headers
        const responseHeaders = new Headers();

        // Copy relevant headers from origin
        response.headers.forEach((value, key) => {
          if (
            ["content-type", "content-length", "etag", "last-modified", "accept-ranges"].includes(
              key.toLowerCase(),
            )
          ) {
            responseHeaders.set(key, value);
          }
        });

        // Set CORS headers
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        responseHeaders.set(
          "Access-Control-Allow-Headers",
          "Range, If-None-Match, If-Modified-Since",
        );

        // Set CDN cache headers
        responseHeaders.set(
          "Cache-Control",
          "public, s-maxage=2592000, stale-while-revalidate=86400",
        );

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        });
      } else if (response) {
        // Server responded but with error
        lastError = `Server ${server}: ${response.status} ${response.statusText}`;
        await markServerBad(sha256, server);
      }
    }

    // All servers failed
    return new Response("Blob not found", {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Reason": lastError || "All servers failed",
      },
    });
  } catch (error) {
    console.error("Error fetching blob:", error);

    return new Response("Internal server error", {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }
}

// Handler for HEAD requests
export async function HEAD(request: Request) {
  const url = new URL(request.url);

  // Extract sha256 from path
  const sha256 = extractSha256FromPath(url.pathname);

  if (!sha256 || sha256.length !== 64) {
    return new Response("Invalid hash", { status: 400 });
  }

  try {
    const servers = await getServerList(sha256);
    let lastError: string = "";

    for (const server of servers) {
      // Skip if server is marked as bad
      if (await isServerBad(sha256, server)) {
        continue;
      }

      const response = await fetchFromServer(server, sha256, "HEAD", request.headers);

      if (response && response.ok) {
        // Success - mark server as good
        await markServerGood(sha256, server);

        // Get BlurHash metadata
        const blurHashMeta = await getBlurHashMetadata(sha256);

        // Create response with proper headers
        const responseHeaders = new Headers();

        // Copy relevant headers from origin
        response.headers.forEach((value, key) => {
          if (
            ["content-type", "content-length", "etag", "last-modified", "accept-ranges"].includes(
              key.toLowerCase(),
            )
          ) {
            responseHeaders.set(key, value);
          }
        });

        // Add BlurHash metadata headers
        if (blurHashMeta) {
          responseHeaders.set("X-BlurHash", blurHashMeta.blurhash);
          responseHeaders.set("X-Width", blurHashMeta.width.toString());
          responseHeaders.set("X-Height", blurHashMeta.height.toString());
          responseHeaders.set("X-Content-Type", blurHashMeta.contentType);
        }

        // Set CORS headers
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        responseHeaders.set(
          "Access-Control-Allow-Headers",
          "Range, If-None-Match, If-Modified-Since",
        );

        // Set CDN cache headers
        responseHeaders.set(
          "Cache-Control",
          "public, s-maxage=2592000, stale-while-revalidate=86400",
        );

        return new Response(null, {
          status: response.status,
          headers: responseHeaders,
        });
      } else if (response) {
        // Server responded but with error
        lastError = `Server ${server}: ${response.status} ${response.statusText}`;
        await markServerBad(sha256, server);
      }
    }

    // All servers failed
    return new Response(null, {
      status: 404,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        "X-Reason": lastError || "All servers failed",
      },
    });
  } catch (error) {
    console.error("Error fetching blob metadata:", error);

    return new Response(null, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    });
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, If-None-Match, If-Modified-Since",
      "Access-Control-Max-Age": "86400",
    },
  });
}
