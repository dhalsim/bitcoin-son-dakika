// // Blossom service implementation for uploading files to Blossom servers
// // Based on the Blossom specification: https://github.com/hzrd149/blossom

import { createHash } from "crypto";

import { finalizeEvent, type EventTemplate } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";
import { createClient } from "redis";
import sharp from "sharp";

import { publishToRelays } from "../../src/lib/utils.js";
import type { UpdateBlossomServersPayload } from "../../src/types/admin.js";
import type { FetchBlobListsResponse } from "../schemas.js";
import type { AuthResult } from "../types.js";
import {
  ADMIN_RELAYS,
  ErrorResponseCreator,
  getBlossomServersEvent,
  PublishEventResponseCreator,
  SuccessResponse,
} from "../utils.js";

import type { BlossomServerBlobs, BlobDescriptor } from "./types.js";

const redis = await createClient({
  url: process.env.REDIS_URL,
}).connect();

export const getServerCacheKey = (server: string) => `blossom-blob-list-${server}`;
export const getLastGoodKey = (sha256: string) => `blossom:last-good:${sha256}`;
export const getBlurHashKey = (sha256: string) => `blossom:blurhash:${sha256}`;
export const getBadServerKey = (sha256: string, server: string) =>
  `blossom:bad:${sha256}:${server}`;
export const getCachedServersKey = () => `blossom:cached-servers`;

// Create Nostr authorization event for Blossom server access
function createBlossomAuthEvent(privateKey: string): string {
  const ONE_HOUR_IN_SECONDS = 60 * 60;

  const nowSeconds = Math.floor(Date.now() / 1000);

  const authEvent: EventTemplate = {
    kind: 24242,
    created_at: nowSeconds,
    content: "List Blobs",
    tags: [
      ["t", "list"],
      ["expiration", (nowSeconds + ONE_HOUR_IN_SECONDS).toString()],
    ],
  };

  const signedEvent = finalizeEvent(authEvent, hexToBytes(privateKey));

  const base64Event = Buffer.from(JSON.stringify(signedEvent)).toString("base64");

  console.log("base64Event", base64Event);

  return base64Event;
}

// Create MASTER-signed auth for specific action with optional x tags
function createMasterAuthBase64(
  privateKey: string,
  action: "get" | "upload" | "list" | "delete",
  xTags?: string[],
  expirationSeconds: number = 60 * 60 * 24,
): string {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const tags: string[][] = [
    ["t", action],
    ["expiration", String(nowSeconds + expirationSeconds)],
  ];

  if (xTags && xTags.length) {
    for (const x of xTags) {
      tags.push(["x", x]);
    }
  }

  const authEvent: EventTemplate = {
    kind: 24242,
    created_at: nowSeconds,
    content: `${action} Blob`,
    tags,
  };

  const signedEvent = finalizeEvent(authEvent, hexToBytes(privateKey));

  return Buffer.from(JSON.stringify(signedEvent)).toString("base64");
}

function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function optimizeImageWithSharp(
  input: Buffer,
  options: { format?: "webp" | "avif" | "jpeg"; quality?: number; maxWidth?: number },
): Promise<{ output: Buffer; mime: string }> {
  const { format = "webp", quality = 82, maxWidth } = options;

  let instance = sharp(input, { failOn: "none" }).rotate();

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

  return { output, mime };
}

async function uploadBufferToServer(
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

export async function handleUploadBlossomMedia(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  paramsData: {
    formData: FormData;
    servers: string[];
    optimize?: boolean;
    format?: "webp" | "avif" | "jpeg";
    quality?: number;
    maxWidth?: number;
  },
): Promise<Response> {
  if (!authResult.success) {
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor") && !authResult.roles.includes("admin")) {
    return ErrorResponseCreator("Yalnızca editörler ve adminler yükleme yapabilir", 403);
  }

  const { formData, servers, optimize, format, quality, maxWidth } = paramsData;

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
    if (optimize && isImage) {
      const { output, mime } = await optimizeImageWithSharp(buffer, { format, quality, maxWidth });
      buffer = output;
      contentType = mime;
    }

    const hashHex = sha256Hex(buffer);
    const authBase64 = createMasterAuthBase64(masterAdminPrivateKey, "upload", [hashHex]);

    const results = await Promise.allSettled(
      servers.map(async (server) => {
        const descriptor = await uploadBufferToServer(server, buffer, contentType, authBase64);
        // Cache updates on success
        await Promise.allSettled([
          redis.set(getLastGoodKey(hashHex), server, { EX: 60 * 60 * 24 }),
          redis.del(getServerCacheKey(server)),
          redis.del(getBadServerKey(hashHex, server)),
        ]);

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

    const blobs: BlobDescriptor[] = await response.json();

    await redis.set(getServerCacheKey(server), JSON.stringify(blobs), { EX: 60 * 60 * 24 });

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
        return JSON.parse(cachedBlobList);
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

export async function handleUpdateBlossomServers(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  requestBody: UpdateBlossomServersPayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor") && !authResult.roles.includes("admin")) {
    return ErrorResponseCreator("Yalnızca editörler haber yayınlayabilir", 403);
  }

  const { servers, lastUpdated } = requestBody;

  const existingEvent = await getBlossomServersEvent();

  if (!existingEvent) {
    return ErrorResponseCreator("Blossom sunucuları eventi bulunamadı", 404);
  }

  if (existingEvent.created_at !== lastUpdated) {
    return ErrorResponseCreator("Data is outdated", 400);
  }

  const eventTemplate: EventTemplate = {
    kind: 10063,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["server", ...servers]],
    content: "",
  };

  const event = finalizeEvent(eventTemplate, hexToBytes(masterAdminPrivateKey));

  const result = await publishToRelays(event, ADMIN_RELAYS);

  // Cache the servers list for fallback use
  await redis.setex(getCachedServersKey(), 60 * 60 * 24 * 7, JSON.stringify(servers)); // 7 days TTL

  return PublishEventResponseCreator(
    { message: "Blossom sunucuları güncellendi", result },
    { servers },
  );
}

// const BLOSSOM_SERVERS = [
//   "https://blossom.band",
//   "https://blossom.primal.net",
//   "https://nostr.download",
//   "https://24242.io",
//   "https://cdn.nostrcheck.me",
//   "https://blossom.nostr.build",
// ];

// export interface BlobDescriptor {
//   url: string;
//   sha256: string;
//   size: number;
//   type: string;
//   uploaded: number;
// }

// export interface Server {
//   url: string;
// }

// export interface BlossomDrive {
//   id: string;
//   name?: string;
//   servers: Server[];
//   x: Array<{
//     sha256: string;
//     mime?: string;
//   }>;
// }

// export interface UserRelay {
//   url: string;
//   read: boolean;
//   write: boolean;
// }

// export interface ServerOption extends Array<Server | boolean> {
//   0: Server;
//   1: boolean;
// }

// export interface NostrAuthResult {
//   success: boolean;
//   pubkey?: string;
//   error?: string;
//   status?: number;
// }

// export class BlossomService {
//   private nostrService: any; // Will be injected

//   constructor(nostrService: any) {
//     this.nostrService = nostrService;
//   }

//   async fetchDrive(
//     drive: BlossomDrive,
//   ): Promise<PromiseSettledResult<{ sha256: string; blob: Blob }>[]> {
//     return Promise.allSettled(
//       drive.x.map(async (x) => {
//         const { blob } = await this.fetchFile(x.sha256, drive.servers, x.mime);

//         return { sha256: x.sha256, blob };
//       }),
//     );
//   }

//   async fetchFile(
//     sha256: string,
//     servers: Server[],
//     mime?: string,
//   ): Promise<{ blob: Blob; size: number; url: string; sha256: string }> {
//     const getExtension = (mime?: string): string => {
//       if (!mime) {
//         return "";
//       }

//       if (mime.includes("svg")) {
//         return ".svg";
//       }

//       return `.${mime.split("/")[1]}`;
//     };

//     const resultArr = await Promise.allSettled([
//       ...servers.map((server) => {
//         const url = server.url.endsWith("/") ? server.url.slice(0, -1) : server.url;

//         return fetch(`${url}/${sha256}` + getExtension(mime));
//       }),
//     ]);

//     const result = resultArr
//       .filter((r) => r.status === "fulfilled")
//       .map((r) => (r as PromiseFulfilledResult<Response>).value)
//       .find((r) => r.ok);

//     if (result) {
//       console.log(`Successfully fetched file ${sha256} from ${result.url}`);
//       const blob = await result.blob();
//       const size = blob.size;
//       const contentType = result.headers.get("content-type");

//       if (mime && contentType !== mime) {
//         throw new Error(`Invalid content type of ${contentType}, from ${result.url}`);
//       }

//       // Verify SHA256 hash of the blob
//       const hash = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
//       const hashString = Array.from(new Uint8Array(hash))
//         .map((b) => b.toString(16).padStart(2, "0"))
//         .join("");

//       if (hashString !== sha256) {
//         throw new Error(`Hash mismatch for ${result.url}`);
//       }

//       return { blob, size, url: result.url, sha256 };
//     }

//     throw new Error(`Failed to fetch file ${sha256} from any server`);
//   }

//   async getBlossomAuthForUploadBlobs(blob: Blob): Promise<string | null> {
//     const pubkey = await this.nostrService.getPubkeyHex();
//     if (!pubkey) {
//       return null;
//     }

//     const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
//     const authEvent = {
//       kind: 24242,
//       created_at: Math.floor(Date.now() / 1000),
//       content: "Upload Blob",
//       tags: [
//         ["t", "upload"],
//         ["expiration", (Math.floor(Date.now() / 1000) + ONE_DAY_IN_SECONDS).toString()],
//       ],
//       pubkey,
//     };

//     const signedAuthEvent = await window.nostr.signEvent(authEvent);

//     return btoa(JSON.stringify(signedAuthEvent));
//   }

//   async getBlossomAuthForMirrorUrls(url: string): Promise<string | null> {
//     const pubkey = await this.nostrService.getPubkeyHex();
//     if (!pubkey) {
//       return null;
//     }

//     const ONE_DAY_IN_SECONDS = 60 * 60 * 24;
//     const sha256 = url.split("/").pop()?.split(".")[0];
//     if (!sha256) {
//       return null;
//     }

//     const authEvent = {
//       kind: 24242,
//       created_at: Math.floor(Date.now() / 1000),
//       content: "Mirror Url",
//       tags: [
//         ["t", "upload"],
//         ["x", sha256],
//         ["expiration", (Math.floor(Date.now() / 1000) + ONE_DAY_IN_SECONDS).toString()],
//       ],
//       pubkey,
//     };

//     const signedAuthEvent = await window.nostr.signEvent(authEvent);

//     return btoa(JSON.stringify(signedAuthEvent));
//   }

//   async uploadAsset(
//     blob: Blob,
//     servers: string[],
//   ): Promise<PromiseSettledResult<BlobDescriptor>[]> {
//     const auth = await this.getBlossomAuthForUploadBlobs(blob);
//     if (!auth) {
//       throw new Error("Failed to get Blossom auth for upload blobs");
//     }

//     return Promise.allSettled(
//       servers.map(async (server) => {
//         const url = server.endsWith("/") ? server.slice(0, -1) : server;
//         const response = await fetch(`${url}/upload`, {
//           headers: {
//             Authorization: `Nostr ${auth}`,
//           },
//           method: "PUT",
//           body: blob,
//         });

//         if (!response.ok) {
//           throw new Error(`Failed to upload asset to ${server}`);
//         }

//         return response.json() as Promise<BlobDescriptor>;
//       }),
//     );
//   }

//   async mirrorFile(
//     url: string,
//     servers: string[],
//   ): Promise<PromiseSettledResult<BlobDescriptor>[]> {
//     const auth = await this.getBlossomAuthForMirrorUrls(url);
//     if (!auth) {
//       throw new Error("Failed to get Blossom auth for mirror URLs");
//     }

//     return Promise.allSettled(
//       servers.map(async (server) => {
//         const serverUrl = server.endsWith("/") ? server.slice(0, -1) : server;
//         const response = await fetch(`${serverUrl}/mirror`, {
//           headers: {
//             Authorization: `Nostr ${auth}`,
//           },
//           method: "PUT",
//           body: JSON.stringify({ url }),
//         });

//         if (!response.ok) {
//           throw new Error(`Failed to mirror file from ${url} to ${server}`);
//         }

//         return response.json() as Promise<BlobDescriptor>;
//       }),
//     );
//   }

//   async getBlossomServers(userRelayList: UserRelay[]): Promise<ServerOption[]> {
//     // Implementation for getting Blossom servers from user relay list
//     // This would typically involve querying Nostr relays for server lists
//     const userWriteRelays = userRelayList.filter((relay) => relay.write).map((relay) => relay.url);

//     // Placeholder implementation - would need actual Nostr querying
//     return [];
//   }

//   async getBlossomDrives(userWriteRelays: string[]): Promise<BlossomDrive[]> {
//     // Implementation for getting Blossom drives
//     // This would typically involve querying Nostr relays for drive information
//     return [];
//   }

//   async publishBlossomServers(servers: Server[], userWriteRelays: string[]): Promise<void> {
//     // Implementation for publishing Blossom servers to Nostr relays
//     // This would typically involve creating and publishing Nostr events
//   }
// }

// // Helper function to convert string to Server type
// export function asServer(serverUrl: string): Server {
//   return { url: serverUrl };
// }

// // Main handler function for upload-to-blossom action
// export async function handleUploadToBlossom(
//   authResult: NostrAuthResult,
//   paramsData: {
//     formData: FormData;
//     servers?: string[];
//     mirrorUrl?: string;
//   },
// ): Promise<Response> {
//   try {
//     const { formData, servers, mirrorUrl } = paramsData;

//     if (!servers || servers.length === 0) {
//       return new Response(JSON.stringify({ error: "No Blossom servers specified" }), {
//         status: 400,
//         headers: { "Content-Type": "application/json" },
//       });
//     }

//     // Create a mock Nostr service for server-side usage
//     const mockNostrService = {
//       getPubkeyHex: async () => authResult.pubkey,
//     };

//     const blossomService = new BlossomService(mockNostrService);

//     if (mirrorUrl) {
//       // Mirror existing file
//       const results = await blossomService.mirrorFile(mirrorUrl, servers);

//       const successful = results
//         .filter((result) => result.status === "fulfilled")
//         .map((result) => (result as PromiseFulfilledResult<BlobDescriptor>).value);

//       return new Response(
//         JSON.stringify({
//           success: true,
//           message: `Successfully mirrored file to ${successful.length} servers`,
//           results: successful,
//         }),
//         {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         },
//       );
//     } else {
//       // Upload new file
//       const file = formData.get("file") as File;
//       if (!file) {
//         return new Response(JSON.stringify({ error: "No file provided" }), {
//           status: 400,
//           headers: { "Content-Type": "application/json" },
//         });
//       }

//       const blob = new Blob([await file.arrayBuffer()], { type: file.type });
//       const results = await blossomService.uploadAsset(blob, servers);

//       const successful = results
//         .filter((result) => result.status === "fulfilled")
//         .map((result) => (result as PromiseFulfilledResult<BlobDescriptor>).value);

//       return new Response(
//         JSON.stringify({
//           success: true,
//           message: `Successfully uploaded file to ${successful.length} servers`,
//           results: successful,
//         }),
//         {
//           status: 200,
//           headers: { "Content-Type": "application/json" },
//         },
//       );
//     }
//   } catch (error) {
//     console.error("Error uploading to Blossom:", error);

//     return new Response(
//       JSON.stringify({
//         error: error instanceof Error ? error.message : "Failed to upload to Blossom",
//       }),
//       {
//         status: 500,
//         headers: { "Content-Type": "application/json" },
//       },
//     );
//   }
// }
