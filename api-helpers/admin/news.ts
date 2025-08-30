import { hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent } from "nostr-tools";
import type { EventTemplate } from "nostr-tools";

import { publishToRelays } from "../../src/lib/utils.js";
import type {
  AddNewsPayload,
  RemoveNewsPayload,
  PublishNewsPayload,
} from "../../src/types/admin.js";
import type { AuthResult } from "../types.js";
import {
  ADMIN_RELAYS,
  ErrorResponseCreator,
  MultiPublishEventResponseCreator,
  PublishEventResponseCreator,
} from "../utils.js";
import type { NewsTag } from "../utils.js";

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

  const { eTag, relays } = data.tagToBeAdded;

  if (!eTag || !relays || relays.length === 0) {
    return ErrorResponseCreator("Event ID and relay are required", 400);
  }

  const existingNews = currentNews.find((news) => news.eTag === eTag);

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
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Yalnızca editörler haber kaldırabilir", 403);
  }

  const { tagToBeRemoved, requestDeletion } = data;

  if (!tagToBeRemoved || !tagToBeRemoved.eTag) {
    return ErrorResponseCreator("Event ID gereklidir", 400);
  }

  const toBeRemoved = currentNews.find((news) => news.eTag === tagToBeRemoved.eTag);

  if (!toBeRemoved) {
    return ErrorResponseCreator("Haber bulunamadı", 404);
  }

  try {
    const removeNewsResult = await removeNews(masterAdminPrivateKey, currentNews, data);

    if (!removeNewsResult.some((r) => r.success)) {
      return ErrorResponseCreator("Haber kaldırılırken hata oluştu", 500);
    }

    if (requestDeletion) {
      const deletionResult = await publishDeletionEvent(
        masterAdminPrivateKey,
        tagToBeRemoved.eTag,
        1,
      );

      if (!deletionResult.some((r) => r.success)) {
        return ErrorResponseCreator(
          "Silme eventi yayınlanırken hata oluştu, ancak setten kaldırıldı",
          500,
        );
      }

      return MultiPublishEventResponseCreator(
        {
          result: {
            removeNewsResult: {
              message: "Haber başarıyla kaldırıldı",
              result: removeNewsResult,
            },
            deletionResult: {
              message: "Silme eventi başarıyla yayınlandı",
              result: deletionResult,
            },
          },
        },
        data,
      );
    }

    return PublishEventResponseCreator(
      { message: "Haber başarıyla kaldırıldı", result: removeNewsResult },
      data,
    );
  } catch (error) {
    return ErrorResponseCreator(error || "Haber kaldırılırken hata oluştu");
  }
}

export async function handlePublishNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: PublishNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Kimlik doğrulama hatası", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Yalnızca editörler haber yayınlayabilir", 403);
  }

  return await publishNews(masterAdminPrivateKey, currentNews, authResult.pubkey, data);
}

export async function addNews(
  masterPrivateKey: string,
  currentNews: NewsTag[],
  data: AddNewsPayload,
) {
  const privateKeyBytes = hexToBytes(masterPrivateKey);
  const currentTime = Math.floor(Date.now() / 1000);

  const eventTemplate = {
    kind: 30004,
    created_at: currentTime,
    tags: [
      ["d", "news"],
      ...currentNews.map((news) => ["e", news.eTag, ...news.relays]),
      ["e", data.tagToBeAdded.eTag, ...data.tagToBeAdded.relays],
    ],
    content: "",
  };

  const event = finalizeEvent(eventTemplate, privateKeyBytes);

  return await publishToRelays(event, ADMIN_RELAYS);
}

export async function removeNews(
  masterPrivateKey: string,
  currentNews: NewsTag[],
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
        .filter((news) => news.eTag !== data.tagToBeRemoved.eTag)
        .map((news) => ["e", news.eTag, ...news.relays]),
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

    const relays = eventPublishResult.filter((r) => r.success).map((r) => r.relay);

    if (relays.length === 0) {
      return ErrorResponseCreator("Haber yayınlanırken hata oluştu", 500);
    }

    const addNewsResult = await addNews(masterPrivateKey, currentNews, {
      action: "add-news",
      tagToBeAdded: {
        eTag: event.id,
        relays,
      },
    });

    if (addNewsResult.some((r) => r.success)) {
      return MultiPublishEventResponseCreator(
        {
          result: {
            eventPublishResult: {
              message: "Haber başarıyla yayınlandı",
              result: eventPublishResult,
            },
            addNewsResult: {
              message: "Haber setine eklendi",
              result: addNewsResult,
            },
          },
        },
        { eventId: event.id, relays, addNewsResult },
      );
    }

    return ErrorResponseCreator("Haber başarıyla yayınlandı, ancak sete eklenemedi", 500);
  } catch (error) {
    return ErrorResponseCreator(error || "Haber yayınlanırken hata oluştu");
  }
}
