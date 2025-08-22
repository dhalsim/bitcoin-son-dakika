import { hexToBytes } from "@noble/hashes/utils";
import { nip19, finalizeEvent } from "nostr-tools";

import { publishToRelays } from "../../src/lib/utils.js";
import type { AuthResult } from "../types.js";
import {
  ADMIN_RELAYS,
  createTitleSlug,
  ErrorResponseCreator,
  PublishEventResponseCreator,
} from "../utils.js";
import type { ArticleTag } from "../utils.js";

import type {
  AddArticlePayload,
  AddArticleResolvedPayload,
  RemoveArticlePayload,
  PublishArticlePayload,
} from "./types.js";

export async function handleAddArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
  data: AddArticlePayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can add articles", 403);
  }

  let aTag: string;
  let relayTag: string;

  if (data.type === "naddr") {
    try {
      const decoded = nip19.decode(data.naddr);
      if (decoded.type !== "naddr") {
        return ErrorResponseCreator("Invalid naddr format", 400);
      }

      aTag = `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`;
      relayTag = decoded.data.relays?.[0] || "wss://relay.damus.io";
    } catch {
      return ErrorResponseCreator("Invalid naddr", 400);
    }
  } else {
    aTag = data.a;
    relayTag = data.relay;
  }

  if (!aTag || !relayTag) {
    return ErrorResponseCreator("Article data is required", 400);
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
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can remove articles", 403);
  }

  const { aTag, relay } = data;
  if (!aTag || !relay) {
    return ErrorResponseCreator("Article data is required", 400);
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
      return ErrorResponseCreator("Article already exists", 409);
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

    if (result.some((r) => r.success)) {
      return PublishEventResponseCreator({ message: "Article added successfully", result }, data);
    }

    const failedRelays = result
      .filter((r) => !r.success)
      .map((r) => r.relay)
      .join(", ");

    return ErrorResponseCreator(`Failed to add article to relays: ${failedRelays}`, 500);
  } catch (error) {
    return ErrorResponseCreator(error || "Failed to add article");
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
      return ErrorResponseCreator("Article not found", 404);
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

    return PublishEventResponseCreator({ message: "Article removed successfully", result }, data);
  } catch (error) {
    return ErrorResponseCreator(error || "Failed to remove article");
  }
}

export async function handlePublishArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
  data: PublishArticlePayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can publish articles", 403);
  }

  return await publishArticle(masterAdminPrivateKey, currentArticles, authResult.pubkey, data);
}

async function publishArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  pubkey: string,
  data: PublishArticlePayload,
): Promise<Response> {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Use existing dTag for updates, or create new one for new articles
    const dIdentifier = data.dTag || createTitleSlug(data.title);

    const eventTags: string[][] = [
      ["d", dIdentifier],
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
      kind: 30023,
      created_at: currentTime,
      tags: eventTags,
      content: data.content,
    } as const;

    const event = finalizeEvent(eventTemplate, privateKeyBytes);

    const result = await publishToRelays(event, ADMIN_RELAYS);

    const relay = result.find((r) => r.success)?.relay;

    if (!relay) {
      return ErrorResponseCreator("Failed to publish article", 500);
    }

    // For updates, we don't need to add to curated set since it already exists
    // For new articles, add to curated set
    if (!data.dTag) {
      const addResult = await addArticle(masterPrivateKey, currentArticles, {
        action: "add-article",
        aTag: `30023:${event.pubkey}:${dIdentifier}`,
        relayTag: relay,
      });

      if (Array.isArray(addResult) ? addResult.some((r) => r.success) : true) {
        return PublishEventResponseCreator(
          { message: "Article published successfully", result },
          { eventId: event.id, relay, addArticleResult: addResult },
        );
      }
    } else {
      // Update case - just return success
      return PublishEventResponseCreator(
        { message: "Article updated successfully", result },
        { eventId: event.id, relay },
      );
    }

    return ErrorResponseCreator("Failed to publish article", 500);
  } catch (error) {
    return ErrorResponseCreator(error || "Failed to publish article");
  }
}
