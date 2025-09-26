// Delete functionality for Blossom servers
import z from "zod";

import type { RedisClient } from "../../common.js";
import { ErrorResponseCreator, SuccessResponse } from "../../common_with_client.js";
import type { AuthResult } from "../../types.js";

import {
  createMasterAuthBase64,
  getLastGoodKey,
  getAggregateListKey,
  getBlobServersKey,
  getBlobIndexKey,
  getServerCacheKey,
  markServerBad,
} from "./common.js";

export const DeleteBlossomMediaResponseSchema = z.object({
  successful: z.array(
    z.object({
      server: z.string(),
      success: z.literal(true),
      status: z.number(),
      message: z.string(),
    }),
  ),
  failed: z.array(
    z.object({
      server: z.string(),
      error: z.string(),
    }),
  ),
  partialFailures: z.array(
    z.object({
      server: z.string(),
      success: z.literal(false),
      status: z.number(),
      message: z.string(),
    }),
  ),
  sha256: z.string(),
});

export type DeleteBlossomMediaResponse = z.infer<typeof DeleteBlossomMediaResponseSchema>;

// Delete blob from a single Blossom server
export async function deleteBlobFromServer(
  server: string,
  sha256: string,
  authBase64: string,
): Promise<{ success: boolean; status: number; message: string }> {
  const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;

  const response = await fetch(`${serverUrl}/${sha256}`, {
    method: "DELETE",
    headers: {
      Authorization: `Nostr ${authBase64}`,
    },
  });

  const reason = response.headers.get("X-Reason") || response.statusText;

  return {
    success: response.ok,
    status: response.status,
    message: response.ok ? "Deleted successfully" : `${response.status} ${reason}`,
  };
}

// Main delete handler
export async function handleDeleteBlossomMedia(
  redis: RedisClient,
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  requestBody: { servers: string[]; sha256: string },
): Promise<Response> {
  if (!authResult.success) {
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor") && !authResult.roles.includes("admin")) {
    return ErrorResponseCreator("Yalnızca editörler ve adminler silme yapabilir", 403);
  }

  const { servers, sha256 } = requestBody;

  if (!servers || servers.length === 0) {
    return ErrorResponseCreator("En az bir sunucu belirtilmelidir", 400);
  }

  if (!sha256 || sha256.length !== 64) {
    return ErrorResponseCreator("Geçersiz SHA256 hash", 400);
  }

  try {
    const authBase64 = createMasterAuthBase64(masterAdminPrivateKey, "delete", [sha256]);

    const results = await Promise.allSettled(
      servers.map(async (server) => {
        const result = await deleteBlobFromServer(server, sha256, authBase64);

        // Cache updates
        if (result.success || result.status === 404) {
          // If delete was successful, mark server as bad for this blob
          await markServerBad(redis, sha256, server);

          // Clear server cache
          await redis.del(getServerCacheKey(server));
          await redis.del(getAggregateListKey());

          // If this was the last-good server, clear it
          const lastGood = await redis.get(getLastGoodKey(sha256));

          if (lastGood === server) {
            await redis.del(getLastGoodKey(sha256));
          }

          // Remove from inverted index
          await redis.sRem(getBlobServersKey(sha256), server);

          const remaining = await redis.sCard(getBlobServersKey(sha256));

          if (remaining === 0) {
            // Remove hash from global index if no servers left
            await redis.sRem(getBlobIndexKey(), sha256);
          }
        }

        if (result.status === 404) {
          result.success = true;
          result.message = "Blob not found, dropped cache";
        }

        return { server, ...result };
      }),
    );

    const successful = results
      .filter(
        (
          r,
        ): r is PromiseFulfilledResult<{
          server: string;
          success: true;
          status: number;
          message: string;
        }> => r.status === "fulfilled" && r.value.success,
      )
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r, idx) => ({
        server: servers[idx],
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      }));

    const partialFailures = results
      .filter(
        (
          r,
        ): r is PromiseFulfilledResult<{
          server: string;
          success: false;
          status: number;
          message: string;
        }> => r.status === "fulfilled" && !r.value.success,
      )
      .map((r) => r.value);

    const data: DeleteBlossomMediaResponse = {
      successful,
      failed,
      partialFailures,
      sha256,
    };

    return SuccessResponse<DeleteBlossomMediaResponse>(data);
  } catch (error) {
    console.error("Error deleting from Blossom:", error);

    return ErrorResponseCreator(
      error instanceof Error ? error.message : "Blossom'dan silme sırasında bir hata oluştu",
      500,
    );
  }
}
