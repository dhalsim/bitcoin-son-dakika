import type { FetchBlobListsResponse } from "../../schemas.js";
import { BlobDescriptorSchema } from "../../schemas.js";
import type { AuthResult } from "../../types.js";
import { ErrorResponseCreator, SuccessResponse } from "../../utils.js";
import type { BlossomServerBlobs, BlobDescriptor } from "../types.js";

import { createBlossomAuthEvent, getServerCacheKey, redis } from "./common.js";

// Fetch blob list from a single Blossom server
async function fetchBlobListFromServer(
  server: string,
  pubkey: string,
  privateKey: string,
): Promise<BlossomServerBlobs> {
  try {
    const authHeader = createBlossomAuthEvent(privateKey);
    const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;

    const response = await fetch(`${serverUrl}/list/${pubkey}`, {
      method: "GET",
      headers: {
        Authorization: `Nostr ${authHeader}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return {
        server,
        blobs: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const responseData = await response.json();

    // Parse different response formats
    let blobs: BlobDescriptor[] = [];

    if (Array.isArray(responseData)) {
      // Handle direct array response (like nostr.download)
      blobs = responseData.map((item: any) => ({
        url: item.url,
        sha256: item.sha256,
        size: item.size,
        type: item.type,
        uploaded: item.uploaded,
      }));
    } else if (responseData && Array.isArray(responseData.blobs)) {
      // Handle wrapped response with blobs array
      blobs = responseData.blobs.map((item: any) => ({
        url: item.url,
        sha256: item.sha256,
        size: item.size,
        type: item.type,
        uploaded: item.uploaded,
      }));
    } else if (responseData && responseData.status === "success") {
      // Handle single blob response (like cdn.nostrcheck.me)
      blobs = [
        {
          url: responseData.url,
          sha256: responseData.sha256,
          size: responseData.size,
          type: responseData.type,
          uploaded: responseData.uploaded,
        },
      ];
    }

    await redis.set(getServerCacheKey(server), JSON.stringify(blobs)); // No TTL - persistent until invalidated

    return {
      server,
      blobs,
    };
  } catch (error) {
    return {
      server,
      blobs: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Fetch blob lists from multiple Blossom servers in parallel
async function fetchBlobListsFromServers(
  servers: string[],
  pubkey: string,
  privateKey: string,
  useCache: boolean,
): Promise<BlossomServerBlobs[]> {
  const promises = servers.map(async (server) => {
    if (useCache) {
      const cachedBlobList = await redis.get(getServerCacheKey(server));

      if (cachedBlobList) {
        try {
          // Parse and validate the cached blobs array
          const parsedBlobs = JSON.parse(cachedBlobList);
          const validatedBlobs = BlobDescriptorSchema.array().parse(parsedBlobs);

          // Reconstruct the full BlossomServerBlobs object
          return {
            server,
            blobs: validatedBlobs,
          } satisfies BlossomServerBlobs;
        } catch (error) {
          console.warn(`Failed to parse cached blob list for ${server}:`, error);
          // If cache parsing fails, fall back to fetching from server
        }
      }
    }

    return fetchBlobListFromServer(server, pubkey, privateKey);
  });

  return Promise.all(promises);
}

// Handler function for fetching blob lists from admin panel
export async function handleFetchBlobLists(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  requestBody: { servers: string[]; useCache: boolean },
): Promise<Response> {
  if (!authResult.success) {
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor") && !authResult.roles.includes("admin")) {
    return ErrorResponseCreator(
      "Yalnızca editörler ve adminler blob listelerini görüntüleyebilir",
      403,
    );
  }

  if (!authResult.pubkey) {
    return ErrorResponseCreator("Public key bulunamadı", 400);
  }

  const { servers, useCache } = requestBody;

  if (!servers || servers.length === 0) {
    return ErrorResponseCreator("En az bir sunucu belirtilmelidir", 400);
  }

  try {
    const blobLists = await fetchBlobListsFromServers(
      servers,
      authResult.pubkey,
      masterAdminPrivateKey,
      useCache,
    );

    return SuccessResponse<FetchBlobListsResponse>({
      success: true,
      message: "Blob lists fetched successfully",
      serverBlobs: blobLists,
    });
  } catch (error) {
    console.error("Error fetching blob lists:", error);

    return ErrorResponseCreator(
      error instanceof Error ? error.message : "Blob listeleri alınırken hata oluştu",
      500,
    );
  }
}
