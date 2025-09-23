import type { EventTemplate } from "nostr-tools";
import { finalizeEvent } from "nostr-tools";
import { hexToBytes } from "nostr-tools/utils";

import { publishToRelays } from "../../src/lib/utils.js";
import type { TagItem } from "../common_with_client.js";
import {
  ADMIN_RELAYS,
  getTagsEvent,
  ErrorResponseCreator,
  PublishEventResponseCreator,
} from "../common_with_client.js";
import type { AuthResult } from "../types.js";

export interface GetTagsResponse {
  tags: TagItem[];
  lastUpdated: number;
}

export interface UpdateTagsPayload {
  tags: TagItem[];
  lastUpdated: number;
}

export async function handleUpdateTags(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  requestBody: UpdateTagsPayload,
): Promise<Response> {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can update tags", 403);
  }

  try {
    const { tags, lastUpdated } = requestBody;

    // Validate tags format
    if (!Array.isArray(tags)) {
      throw new Error("Tags must be an array");
    }

    for (const tag of tags) {
      if (!tag.tag || !tag.label) {
        throw new Error("Each tag must have both 'tag' and 'label' properties");
      }
    }

    const existingEvent = await getTagsEvent();

    if (!existingEvent) {
      throw new Error("Tags event not found");
    }

    if (existingEvent.created_at !== lastUpdated) {
      return ErrorResponseCreator("Data is outdated", 400);
    }

    const eventTemplate: EventTemplate = {
      kind: 30004,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", "categories"], ...tags.map((tag) => ["t", tag.tag, tag.label])],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, hexToBytes(masterAdminPrivateKey));

    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponseCreator(
      { message: "Tags updated successfully", result },
      { eventId: event.id, relays: result },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Failed to update tags";

    console.error("Error updating tags:", errorMessage);

    return new Response(JSON.stringify({ error: `Failed to update tags: ${errorMessage}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
