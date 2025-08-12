import { hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent } from "nostr-tools";

import { publishToRelays } from "../../src/lib/utils.js";
import type { AuthResult } from "../types.js";
import { ADMIN_RELAYS, ErrorResponse, PublishEventResponse } from "../utils.js";
import type { NewsTag } from "../utils.js";

import type { AddNewsPayload, RemoveNewsPayload, PublishNewsPayload } from "./types.js";

export async function handleAddNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: AddNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can add news", 403);
  }

  const { eventId, relay } = data;
  if (!eventId || !relay) {
    return ErrorResponse(undefined, "Event ID and relay are required", 400);
  }

  const existingNews = currentNews.find(
    (news) => news.eTag === data.eventId && news.relay === data.relay,
  );

  if (existingNews) {
    return ErrorResponse(undefined, "News already exists", 409);
  }

  try {
    const result = await addNews(masterAdminPrivateKey, currentNews, data);

    return PublishEventResponse({ message: `News added successfully`, result }, data);
  } catch (error) {
    return ErrorResponse(error as Error);
  }
}

export async function handleRemoveNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: RemoveNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can remove news", 403);
  }

  const { eventId, relay } = data;
  if (!eventId || !relay) {
    return ErrorResponse(undefined, "Event ID and relay are required", 400);
  }

  return await removeNews(masterAdminPrivateKey, currentNews, data);
}

export async function handlePublishNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: PublishNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can publish news", 403);
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
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    const toBeRemoved = currentNews.find((news) => news.eTag === data.eventId);

    if (!toBeRemoved) {
      return ErrorResponse(undefined, "News item not found", 404);
    }

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
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse({ message: "News removed successfully", result }, data);
  } catch (error) {
    return ErrorResponse(error as Error);
  }
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

    const result = await publishToRelays(event, ADMIN_RELAYS);

    const relay = result.find((r) => r.success)?.relay;

    if (!relay) {
      return ErrorResponse(undefined, "Failed to publish news", 500);
    }

    const addNewsResult = await addNews(masterPrivateKey, currentNews, {
      action: "add-news",
      eventId: event.id,
      relay,
    });

    if (addNewsResult.some((r) => r.success)) {
      return PublishEventResponse(
        { message: "News published successfully", result },
        { eventId: event.id, relay, addNewsResult },
      );
    }

    return ErrorResponse(undefined, "Failed to publish news", 500);
  } catch (error) {
    if (error instanceof Error) {
      return ErrorResponse(error);
    } else if (typeof error === "string") {
      return ErrorResponse(undefined, error);
    }

    return ErrorResponse(undefined, "Unknown error", 500);
  }
}
