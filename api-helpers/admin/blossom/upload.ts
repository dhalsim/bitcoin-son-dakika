// Upload functionality for Blossom servers
import { encode } from "blurhash";
import sharp from "sharp";

import type { AuthResult } from "../../types.js";
import type { RedisClient } from "../../utils.js";
import { ErrorResponseCreator, SuccessResponse } from "../../utils.js";
import type { BlobDescriptor } from "../types.js";

import {
  createMasterAuthBase64,
  getBadServerKey,
  getBlurHashKey,
  getServerCacheKey,
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
  let buffer = Buffer.from(inputArrayBuffer) as Buffer;
  let contentType = file.type || "application/octet-stream";
  const isImage = contentType.startsWith("image/");

  try {
    let blurhashData: { blurhash: string; width: number; height: number } | null = null;

    if (optimize && isImage) {
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
        await redis.del(getBadServerKey(hashHex, server));

        // Store BlurHash metadata if available
        if (blurhashData) {
          const blurhashMetadata = {
            blurhash: blurhashData.blurhash,
            width: blurhashData.width,
            height: blurhashData.height,
            contentType,
          };
          await redis.set(getBlurHashKey(hashHex), JSON.stringify(blurhashMetadata));
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
