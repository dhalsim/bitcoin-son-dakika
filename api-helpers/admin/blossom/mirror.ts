import type { AuthResult } from "../../types.js";
import type { RedisClient } from "../../utils.js";
import { ErrorResponseCreator, SuccessResponse } from "../../utils.js";
import type { BlobDescriptor } from "../types.js";

import {
  createMasterAuthBase64,
  extractSha256FromUrl,
  getBadServerKey,
  getServerCacheKey,
  markServerGood,
} from "./common.js";

// Mirror blob from source URL to target servers
export async function mirrorBlobToServer(
  server: string,
  sourceUrl: string,
  sha256: string,
  authBase64: string,
): Promise<BlobDescriptor> {
  const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;

  const response = await fetch(`${serverUrl}/mirror`, {
    method: "PUT",
    headers: {
      Authorization: `Nostr ${authBase64}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: sourceUrl }),
  });

  if (!response.ok) {
    const reason = response.headers.get("X-Reason") || response.statusText;

    throw new Error(`Mirror failed on ${server}: ${response.status} ${reason}`);
  }

  return (await response.json()) as BlobDescriptor;
}

// Main mirror handler
export async function handleMirrorBlossomMedia(
  redis: RedisClient,
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  requestBody: { servers: string[]; sourceUrl: string },
): Promise<Response> {
  if (!authResult.success) {
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor") && !authResult.roles.includes("admin")) {
    return ErrorResponseCreator("Yalnızca editörler ve adminler mirror yapabilir", 403);
  }

  const { servers, sourceUrl } = requestBody;

  if (!servers || servers.length === 0) {
    return ErrorResponseCreator("En az bir sunucu belirtilmelidir", 400);
  }

  if (!sourceUrl) {
    return ErrorResponseCreator("Kaynak URL belirtilmelidir", 400);
  }

  // Extract sha256 from source URL
  const sha256 = extractSha256FromUrl(sourceUrl);
  if (!sha256) {
    return ErrorResponseCreator("Geçersiz kaynak URL - SHA256 hash bulunamadı", 400);
  }

  try {
    const authBase64 = createMasterAuthBase64(masterAdminPrivateKey, "upload", [sha256]);

    const results = await Promise.allSettled(
      servers.map(async (server) => {
        const descriptor = await mirrorBlobToServer(server, sourceUrl, sha256, authBase64);

        // Cache updates on success - sequential to ensure consistency
        await markServerGood(redis, sha256, server);

        await redis.del(getServerCacheKey(server));
        await redis.del(getBadServerKey(sha256, server));

        return { server, descriptor };
      }),
    );

    const successful = results
      .filter(
        (r): r is PromiseFulfilledResult<{ server: string; descriptor: BlobDescriptor }> =>
          r.status === "fulfilled",
      )
      .map((r) => r.value);

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r, idx) => ({
        server: servers[idx],
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      }));

    return SuccessResponse({
      message: `Mirrored to ${successful.length} / ${servers.length} servers`,
      data: {
        successful,
        failed,
        sha256,
        sourceUrl,
      },
    });
  } catch (error) {
    console.error("Error mirroring to Blossom:", error);

    return ErrorResponseCreator(
      error instanceof Error ? error.message : "Blossom'a mirror sırasında bir hata oluştu",
      500,
    );
  }
}
