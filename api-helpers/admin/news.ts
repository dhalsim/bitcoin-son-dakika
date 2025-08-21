import { hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent } from "nostr-tools";
import type { EventTemplate } from "nostr-tools";

import { publishToRelays } from "../../src/lib/utils.js";
import type { AuthResult } from "../types.js";
import {
  ADMIN_RELAYS,
  ErrorResponseCreator,
  MultiPublishEventResponseCreator,
  PublishEventResponseCreator,
} from "../utils.js";
import type { NewsTag } from "../utils.js";

import type { AddNewsPayload, RemoveNewsPayload, PublishNewsPayload } from "./types.js";

export async function handleAddNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: AddNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can add news", 403);
  }

  const { eventId, relay } = data;
  if (!eventId || !relay) {
    return ErrorResponseCreator("Event ID and relay are required", 400);
  }

  const existingNews = currentNews.find(
    (news) => news.eTag === data.eventId && news.relay === data.relay,
  );

  if (existingNews) {
    return ErrorResponseCreator("News already exists", 409);
  }

  try {
    const result = await addNews(masterAdminPrivateKey, currentNews, data);

    return PublishEventResponseCreator({ message: `News added successfully`, result }, data);
  } catch (error) {
    return ErrorResponseCreator(error || "Failed to add news");
  }
}

async function publishDeletionEvent(
  privateKey: string,
  eventId: string,
  eventKind: number,
  content: string = "This post was published by accident",
) {
  const privateKeyBytes = hexToBytes(privateKey);
  const currentTime = Math.floor(Date.now() / 1000);

  const eventTemplate: EventTemplate = {
    kind: 5,
    created_at: currentTime,
    tags: [
      ["e", eventId],
      ["k", String(eventKind)],
    ],
    content,
  };

  const event = finalizeEvent(eventTemplate, privateKeyBytes);

  return await publishToRelays(event, ADMIN_RELAYS);
}

export async function handleRemoveNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: RemoveNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can remove news", 403);
  }

  const { eventId, relay, requestDeletion } = data;
  if (!eventId || !relay) {
    return ErrorResponseCreator("Event ID and relay are required", 400);
  }

  const toBeRemoved = currentNews.find((news) => news.eTag === data.eventId);

  if (!toBeRemoved) {
    return ErrorResponseCreator("News item not found", 404);
  }

  try {
    const removeNewsResult = await removeNews(masterAdminPrivateKey, currentNews, data);

    if (!removeNewsResult.some((r) => r.success)) {
      return ErrorResponseCreator("Failed to remove news", 500);
    }

    if (requestDeletion) {
      const deletionResult = await publishDeletionEvent(masterAdminPrivateKey, eventId, 1);

      if (!deletionResult.some((r) => r.success)) {
        return ErrorResponseCreator(
          "Failed to publish deletion event, but removed from the set",
          500,
        );
      }

      return MultiPublishEventResponseCreator(
        {
          result: {
            removeNewsResult: {
              message: "News removed successfully",
              result: removeNewsResult,
            },
            deletionResult: {
              message: "Deletion event published successfully",
              result: deletionResult,
            },
          },
        },
        data,
      );
    }

    return PublishEventResponseCreator(
      { message: "News removed successfully", result: removeNewsResult },
      data,
    );
  } catch (error) {
    return ErrorResponseCreator(error || "Failed to remove news");
  }
}

export async function handlePublishNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: PublishNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can publish news", 403);
  }

  return await publishNews(masterAdminPrivateKey, currentNews, authResult.pubkey, data);
}

export async function addNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: AddNewsPayload,
) {
  const privateKeyBytes = hexToBytes(masterPrivateKey);
  const currentTime = Math.floor(Date.now() / 1000);

  const eventTemplate = {
    kind: 30004,
    created_at: currentTime,
    tags: [
      ["d", "news"],
      ...currentNews.map((news) => ["e", news.eTag, news.relay]),
      ["e", data.eventId, data.relay],
    ],
    content: "",
  };

  const event = finalizeEvent(eventTemplate, privateKeyBytes);

  return await publishToRelays(event, ADMIN_RELAYS);
}

export async function removeNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: RemoveNewsPayload,
) {
  const privateKeyBytes = hexToBytes(masterPrivateKey);
  const currentTime = Math.floor(Date.now() / 1000);

  const eventTemplate = {
    kind: 30004,
    created_at: currentTime,
    tags: [
      ["d", "news"],
      ...currentNews
        .filter((news) => news.eTag !== data.eventId)
        .map((news) => ["e", news.eTag, news.relay]),
    ],
    content: "",
  };

  const event = finalizeEvent(eventTemplate, privateKeyBytes);

  return publishToRelays(event, ADMIN_RELAYS);
}

export async function publishNews(
  masterPrivateKey: string,
  currentNews: NewsTag[],
  pubkey: string,
  data: PublishNewsPayload,
): Promise<Response> {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    const eventTags: string[][] = [
      ["title", data.title],
      ["editor", pubkey],
      ...data.tags.map((tag) => ["t", tag]),
    ];

    if (data.summary) {
      eventTags.push(["summary", data.summary]);
    }

    if (data.image) {
      eventTags.push(["image", data.image]);
    }

    const eventTemplate = {
      kind: 1,
      created_at: currentTime,
      tags: eventTags,
      content: data.content,
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);

    const eventPublishResult = await publishToRelays(event, ADMIN_RELAYS);

    const relay = eventPublishResult.find((r) => r.success)?.relay;

    if (!relay) {
      return ErrorResponseCreator("Failed to publish news", 500);
    }

    const addNewsResult = await addNews(masterPrivateKey, currentNews, {
      action: "add-news",
      eventId: event.id,
      relay,
    });

    if (addNewsResult.some((r) => r.success)) {
      return MultiPublishEventResponseCreator(
        {
          result: {
            eventPublishResult: {
              message: "News published successfully",
              result: eventPublishResult,
            },
            addNewsResult: {
              message: "News added successfully",
              result: addNewsResult,
            },
          },
        },
        { eventId: event.id, relay, addNewsResult },
      );
    }

    return ErrorResponseCreator("News published successfully, but failed to add to the set", 500);
  } catch (error) {
    return ErrorResponseCreator(error || "Failed to publish news");
  }
}
