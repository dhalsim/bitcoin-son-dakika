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

type PrepareOptions = {
  optimize: boolean;
  generateBlurHash: boolean;
  format: "webp" | "avif" | "jpeg";
  quality: number;
  maxWidth: number | null;
};

type PreparedUpload = {
  buffer: Buffer;
  contentType: string;
  originalWidth?: number;
  originalHeight?: number;
  blurhashData?: { blurhash: string; width: number; height: number } | null;
  isImage: boolean;
  isGif: boolean;
};

async function prepareUploadFromBuffer(
  inputBuffer: Buffer,
  initialContentType: string,
  options: PrepareOptions,
): Promise<PreparedUpload> {
  let buffer = inputBuffer;
  let contentType = initialContentType || "application/octet-stream";
  const isImage = contentType.startsWith("image/");
  const isGif = contentType.toLowerCase() === "image/gif";

  let blurhashData: { blurhash: string; width: number; height: number } | null = null;
  let originalWidth: number | undefined;
  let originalHeight: number | undefined;

  if (isImage) {
    try {
      const meta = await sharp(inputBuffer).metadata();
      originalWidth = meta.width || undefined;
      originalHeight = meta.height || undefined;
    } catch (e) {
      console.warn("Failed to get image metadata:", e);
    }
  }

  // Only optimize safe/static images; never optimize GIF to avoid losing animation
  if (options.optimize && isImage && !isGif) {
    const { output, mime } = await optimizeImageWithSharp(
      buffer,
      options.format,
      options.quality,
      options.maxWidth,
    );
    buffer = output;
    contentType = mime;

    if (options.generateBlurHash) {
      const res = await generateBlurHash(buffer);
      blurhashData = res;
    }
  }

  return {
    buffer,
    contentType,
    originalWidth,
    originalHeight,
    blurhashData,
    isImage,
    isGif,
  };
}

async function uploadProcessedToServers(
  redis: RedisClient,
  masterAdminPrivateKey: string,
  servers: string[],
  processed: PreparedUpload,
): Promise<{
  successful: { server: string; descriptor: BlobDescriptor }[];
  failed: { server: string; error: string }[];
  hashHex: string;
  size: number;
}> {
  const hashHex = await sha256Hex(processed.buffer);
  const authBase64 = createMasterAuthBase64(masterAdminPrivateKey, "upload", [hashHex]);

  const results = await Promise.allSettled(
    servers.map(async (server) => {
      const descriptor = await uploadBufferToServer(
        server,
        processed.buffer,
        processed.contentType,
        authBase64,
      );

      // Cache updates
      await markServerGood(redis, hashHex, server);
      await redis.del(getServerCacheKey(server));
      await redis.del(getAggregateListKey());
      await redis.del(getBadServerKey(hashHex, server));
      await redis.sAdd(getBlobServersKey(hashHex), server);
      await redis.sAdd(getBlobIndexKey(), hashHex);

      // Store metadata if image
      if (processed.isImage) {
        const metaToStore = {
          blurhash: processed.blurhashData ? processed.blurhashData.blurhash : undefined,
          width: processed.originalWidth,
          height: processed.originalHeight,
          contentType: processed.contentType,
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

  return { successful, failed, hashHex, size: processed.buffer.length };
}

async function downloadUrlToBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await fetch(url, { headers: { "Accept-Encoding": "identity" } });
  if (!res.ok) {
    const reason = res.statusText || "Kaynak indirilemedi";

    throw new Error(`${res.status} ${reason}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer) as Buffer;
  const contentType = res.headers.get("content-type") || "application/octet-stream";

  return { buffer, contentType };
}

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

  try {
    const inputArrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(inputArrayBuffer) as Buffer;

    const prepared = await prepareUploadFromBuffer(
      originalBuffer,
      file.type || "application/octet-stream",
      {
        optimize,
        generateBlurHash: shouldGenerateBlurHash,
        format,
        quality,
        maxWidth,
      },
    );

    const { successful, failed, hashHex, size } = await uploadProcessedToServers(
      redis,
      masterAdminPrivateKey,
      servers,
      prepared,
    );

    return SuccessResponse({
      message: `Uploaded to ${successful.length} / ${servers.length} servers`,
      data: {
        successful,
        failed,
        sha256: hashHex,
        contentType: prepared.contentType,
        size,
        blurhash: prepared.blurhashData || null,
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

// Upload from a remote URL (server-side download then /upload to Blossom)
export async function handleUploadFileUrl(
  redis: RedisClient,
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  requestBody: {
    servers: string[];
    url: string;
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
    servers,
    url,
    optimize,
    generateBlurHash: shouldGenerateBlurHash,
    format,
    quality,
    maxWidth,
  } = requestBody;

  if (!servers || servers.length === 0) {
    return ErrorResponseCreator("En az bir sunucu belirtilmelidir", 400);
  }

  if (!url) {
    return ErrorResponseCreator("Kaynak URL belirtilmelidir", 400);
  }

  try {
    const { buffer, contentType } = await downloadUrlToBuffer(url);

    const prepared = await prepareUploadFromBuffer(buffer, contentType, {
      optimize,
      generateBlurHash: shouldGenerateBlurHash,
      format,
      quality,
      maxWidth,
    });

    const { successful, failed, hashHex, size } = await uploadProcessedToServers(
      redis,
      masterAdminPrivateKey,
      servers,
      prepared,
    );

    return SuccessResponse({
      message: `Uploaded (from URL) to ${successful.length} / ${servers.length} servers`,
      data: {
        successful,
        failed,
        sha256: hashHex,
        contentType: prepared.contentType,
        size,
        blurhash: prepared.blurhashData || null,
        sourceUrl: url,
      },
    });
  } catch (error) {
    console.error("Error uploading file URL to Blossom:", error);

    return ErrorResponseCreator(
      error instanceof Error ? error.message : "URL'den yükleme sırasında bir hata oluştu",
      500,
    );
  }
}
