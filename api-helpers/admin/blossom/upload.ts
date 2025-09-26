import { encode } from "blurhash";
import sharp from "sharp";

import type { RedisClient } from "../../common.js";
import { ErrorResponseCreator, SuccessResponse } from "../../common_with_client.js";
import type { AuthResult } from "../../types.js";
import type { BlobDescriptor } from "../types.js";

import {
  createMasterAuthBase64,
  getBadServerKey,
  getBlurHashKey,
  getServerCacheKey,
  getBlobServersKey,
  getBlobIndexKey,
  getAggregateListKey,
  markServerGood,
  sha256Hex,
} from "./common.js";

// Image optimization with sharp (no BlurHash)
export async function optimizeImageWithSharp(
  input: Buffer,
  format: "webp" | "avif" | "jpeg",
  quality: number,
  maxWidth: number | null,
): Promise<{ output: Buffer; mime: string }> {
  let instance = sharp(input, { failOn: "none" });

  if (maxWidth && Number.isFinite(maxWidth)) {
    instance = instance.resize({
      width: Math.floor(maxWidth),
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  if (format === "avif") {
    instance = instance.avif({ quality });
  } else if (format === "jpeg") {
    instance = instance.jpeg({ quality, mozjpeg: true });
  } else {
    instance = instance.webp({ quality });
  }

  const output = await instance.toBuffer();
  const mime = format === "avif" ? "image/avif" : format === "jpeg" ? "image/jpeg" : "image/webp";

  return {
    output,
    mime,
  };
}

// Generate BlurHash from image buffer
export async function generateBlurHash(
  imageBuffer: Buffer,
): Promise<{ blurhash: string; width: number; height: number }> {
  const { data, info } = await sharp(imageBuffer)
    .resize(32, 32, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const blurhash = encode(
    new Uint8ClampedArray(data),
    info.width,
    info.height,
    4, // components
    3, // componentX
  );

  return {
    blurhash,
    width: info.width,
    height: info.height,
  };
}

// Upload buffer to a single Blossom server
export async function uploadBufferToServer(
  server: string,
  data: Buffer,
  contentType: string,
  authBase64: string,
): Promise<BlobDescriptor> {
  const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;

  const response = await fetch(`${serverUrl}/upload`, {
    method: "PUT",
    headers: {
      Authorization: `Nostr ${authBase64}`,
      "Content-Type": contentType,
      "Content-Length": String(data.length),
    },
    body: new Uint8Array(data),
  });

  if (!response.ok) {
    const reason = response.headers.get("X-Reason") || response.statusText;

    throw new Error(`Upload failed on ${server}: ${response.status} ${reason}`);
  }

  return (await response.json()) as BlobDescriptor;
}

// Main upload handler
export async function handleUploadBlossomMedia(
  redis: RedisClient,
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  paramsData: {
    formData: FormData;
    servers: string[];
    optimize: boolean;
    generateBlurHash: boolean;
    format: "webp" | "avif" | "jpeg";
    quality: number;
    maxWidth: number | null;
  },
): Promise<Response> {
  if (!authResult.success) {
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor") && !authResult.roles.includes("admin")) {
    return ErrorResponseCreator("Yalnızca editörler ve adminler yükleme yapabilir", 403);
  }

  const {
    formData,
    servers,
    optimize,
    generateBlurHash: shouldGenerateBlurHash,
    format,
    quality,
    maxWidth,
  } = paramsData;

  if (!servers || servers.length === 0) {
    return ErrorResponseCreator("En az bir sunucu belirtilmelidir", 400);
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return ErrorResponseCreator("Dosya bulunamadı", 400);
  }

  const inputArrayBuffer = await file.arrayBuffer();

  // Preserve original buffer to capture original dimensions
  const originalBuffer = Buffer.from(inputArrayBuffer) as Buffer;

  let buffer = originalBuffer;
  let contentType = file.type || "application/octet-stream";

  const isImage = contentType.startsWith("image/");
  const isGif = contentType.toLowerCase() === "image/gif";

  try {
    let blurhashData: { blurhash: string; width: number; height: number } | null = null;
    let originalWidth: number | undefined;
    let originalHeight: number | undefined;

    if (isImage) {
      try {
        const meta = await sharp(originalBuffer).metadata();
        originalWidth = meta.width || undefined;
        originalHeight = meta.height || undefined;
      } catch (e) {
        console.warn(`Failed to get metadata for ${file.name}: ${e}`);
      }
    }

    // Only optimize safe/static images; never optimize GIF to avoid losing animation
    if (optimize && isImage && !isGif) {
      const { output, mime } = await optimizeImageWithSharp(buffer, format, quality, maxWidth);

      buffer = output;
      contentType = mime;

      // Generate BlurHash if requested
      if (shouldGenerateBlurHash) {
        const blurhashResult = await generateBlurHash(buffer);

        blurhashData = blurhashResult;
      }
    }

    const hashHex = await sha256Hex(buffer);

    const authBase64 = createMasterAuthBase64(masterAdminPrivateKey, "upload", [hashHex]);

    const results = await Promise.allSettled(
      servers.map(async (server) => {
        const descriptor = await uploadBufferToServer(server, buffer, contentType, authBase64);

        // Cache updates on success - sequential to ensure consistency
        await markServerGood(redis, hashHex, server);

        await redis.del(getServerCacheKey(server));
        await redis.del(getAggregateListKey());
        await redis.del(getBadServerKey(hashHex, server));

        // Update inverted index: blob -> servers and global blob index
        await redis.sAdd(getBlobServersKey(hashHex), server);
        await redis.sAdd(getBlobIndexKey(), hashHex);

        // Store metadata (original dimensions if available) and optional blurhash
        if (isImage) {
          const metaToStore = {
            blurhash: blurhashData ? blurhashData.blurhash : undefined,
            // Prefer original dimensions as requested
            width: originalWidth,
            height: originalHeight,
            contentType,
          } as Record<string, unknown>;

          await redis.set(getBlurHashKey(hashHex), JSON.stringify(metaToStore));
        }

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
      message: `Uploaded to ${successful.length} / ${servers.length} servers`,
      data: {
        successful,
        failed,
        sha256: hashHex,
        contentType,
        size: buffer.length,
        blurhash: blurhashData,
      },
    });
  } catch (error) {
    console.error("Error uploading to Blossom:", error);

    return ErrorResponseCreator(
      error instanceof Error ? error.message : "Blossom'a yükleme sırasında bir hata oluştu",
      500,
    );
  }
}
