import { finalizeEvent, type EventTemplate } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";

import { publishToRelays } from "../../../src/lib/utils.js";
import type { UpdateBlossomServersPayload } from "../../../src/types/admin.js";
import type { AuthResult } from "../../types.js";
import type { RedisClient } from "../../utils.js";
import {
  ADMIN_RELAYS,
  getBlossomServersEvent,
  ErrorResponseCreator,
  PublishEventResponseCreator,
} from "../../utils.js";

import { getCachedServersKey } from "./common.js";

export async function handleUpdateBlossomServers(
  redis: RedisClient,
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
    tags: servers.map((server) => ["server", server]),
    content: "",
  };

  const event = finalizeEvent(eventTemplate, hexToBytes(masterAdminPrivateKey));

  const result = await publishToRelays(event, ADMIN_RELAYS);

  // Cache the servers list for fallback use
  const _7daysInSeconds = 60 * 60 * 24 * 7;

  await redis.set(getCachedServersKey(), JSON.stringify(servers), {
    expiration: { type: "EX", value: _7daysInSeconds },
  }); // 7 days TTL

  return PublishEventResponseCreator(
    { message: "Blossom sunucuları güncellendi", result },
    { servers },
  );
}
