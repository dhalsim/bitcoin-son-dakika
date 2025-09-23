import { finalizeEvent, type EventTemplate } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";

import { publishToRelays } from "../../../src/lib/utils.js";
import type { UpdateBlossomServersPayload } from "../../../src/types/admin.js";
import type { AuthResult } from "../../types.js";
import { ErrorResponseCreator, PublishEventResponseCreator } from "../../utils.js";
import { ADMIN_RELAYS, getBlossomServersEvent } from "../../utils.js";

import { getCachedServersKey, redis } from "./common.js";

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
    tags: servers.map((server) => ["server", server]),
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
