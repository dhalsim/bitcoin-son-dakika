import { hexToBytes } from "@noble/hashes/utils";
import { nip19, finalizeEvent } from "nostr-tools";

import { publishToRelays } from "../../src/lib/utils.js";
import type { AuthResult } from "../types.js";
import { ADMIN_RELAYS, ErrorResponse, PublishEventResponse } from "../utils.js";
import type { ArticleTag } from "../utils.js";

import type {
  AddArticlePayload,
  AddArticleResolvedPayload,
  RemoveArticlePayload,
} from "./types.js";

export async function handleAddArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
  data: AddArticlePayload,
) {
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can add articles", 403);
  }

  let aTag: string;
  let relayTag: string;

  if (data.type === "naddr") {
    try {
      const decoded = nip19.decode(data.naddr);
      if (decoded.type !== "naddr") {
        return ErrorResponse(undefined, "Invalid naddr format", 400);
      }

      aTag = `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`;
      relayTag = decoded.data.relays?.[0] || "wss://relay.damus.io";
    } catch {
      return ErrorResponse(undefined, "Invalid naddr", 400);
    }
  } else {
    aTag = data.a;
    relayTag = data.relay;
  }

  if (!aTag || !relayTag) {
    return ErrorResponse(undefined, "Article data is required", 400);
  }

  return await addArticle(masterAdminPrivateKey, currentArticles, {
    aTag,
    relayTag,
    action: data.action,
  });
}

export async function handleRemoveArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
  data: RemoveArticlePayload,
) {
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can remove articles", 403);
  }

  const { aTag, relay } = data;
  if (!aTag || !relay) {
    return ErrorResponse(undefined, "Article data is required", 400);
  }

  return await removeArticle(masterAdminPrivateKey, currentArticles, data);
}

export async function addArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  data: AddArticleResolvedPayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    const existingArticle = currentArticles.find(
      (article) => article.aTag === data.aTag && article.relay === data.relayTag,
    );
    if (existingArticle) {
      return ErrorResponse(undefined, "Article already exists", 409);
    }

    const eventTemplate = {
      kind: 30004,
      created_at: currentTime,
      tags: [
        ["d", "articles"],
        ...currentArticles.map((article) => ["a", article.aTag, article.relay]),
        ["a", data.aTag, data.relayTag],
      ],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse({ message: "Article added successfully", result }, data);
  } catch (error) {
    return ErrorResponse(error as Error);
  }
}

export async function removeArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  data: RemoveArticlePayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    const toBeRemoved = currentArticles.find(
      (article) => article.aTag === data.aTag && article.relay === data.relay,
    );
    if (!toBeRemoved) {
      return ErrorResponse(undefined, "Article not found", 404);
    }

    const eventTemplate = {
      kind: 30004,
      created_at: currentTime,
      tags: [
        ["d", "articles"],
        ...currentArticles
          .filter((article) => article.aTag !== data.aTag)
          .map((article) => ["a", article.aTag, article.relay]),
      ],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse({ message: "Article removed successfully", result }, data);
  } catch (error) {
    return ErrorResponse(error as Error);
  }
}
