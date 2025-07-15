import { hexToBytes } from "@noble/hashes/utils";
import type { NostrEvent } from "nostr-tools";
import { finalizeEvent, nip19, Relay } from "nostr-tools";

import type { Context } from "./types";
import type { ArticleTag, NewsTag } from "./utils";
import {
  ErrorResponse,
  SuccessResponse,
  ADMIN_RELAYS,
  MASTER_ADMIN_PUBKEY,
  authenticateNIP98,
  fetchNostrSets,
  pool,
} from "./utils";

export async function onRequestGet() {
  try {
    // For GET requests, return public admin data (no authentication required for viewing)
    const { adminUsers, editorUsers, articles, news } = await fetchNostrSets();

    return SuccessResponse({
      adminUsers,
      editorUsers,
      articles,
      news,
    });
  } catch (error) {
    console.error("Admin GET error:", error);

    return ErrorResponse(error);
  }
}

export async function onRequestPost(context: Context) {
  const masterAdminPrivateKey = context.env.MASTER_ADMIN_PRIVATEKEY;

  try {
    const { adminUsers, editorUsers, articles, news } = await fetchNostrSets();

    // MANDATORY AUTHENTICATION for all POST actions
    const authResult = await authenticateNIP98(
      context.request.headers.get("Authorization") || "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const requestBody = await context.request.json();
    const { action } = requestBody;

    switch (action) {
      case "add-editor-pubkey":
        return handleAddEditor(masterAdminPrivateKey, authResult, requestBody);
      case "remove-editor-pubkey":
        return handleRemoveEditor(
          masterAdminPrivateKey,
          authResult,
          requestBody,
        );
      case "add-admin-pubkey":
        return handleAddAdmin(masterAdminPrivateKey, authResult, requestBody);
      case "remove-admin-pubkey":
        return handleRemoveAdmin(
          masterAdminPrivateKey,
          authResult,
          requestBody,
        );
      case "add-article":
        return handleAddArticle(
          masterAdminPrivateKey,
          authResult,
          articles,
          requestBody,
        );
      case "add-news":
        return handleAddNews(
          masterAdminPrivateKey,
          authResult,
          news,
          requestBody,
        );
      default:
        return ErrorResponse(undefined, "Invalid action", 400);
    }
  } catch (error) {
    console.error("Admin POST error:", error);

    return ErrorResponse(error);
  }
}

// Handle CORS preflight requests

// Helper functions for user management
type AuthResult =
  | {
      success: true;
      pubkey: string;
      roles: string[];
    }
  | {
      success: false;
      error: string;
      status: number;
    };

// Action handlers
interface AdminActionData {
  pubkey?: string;
}

type AddArticlePayload =
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; a: string; relay: string };

type AddNewsPayload = {
  action: "add-news";
  eventId: string;
  relay: string;
};

async function handleAddEditor(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can add editors
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can add editors", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "editor-users",
    pubkey,
    "add",
  );
}

async function handleRemoveEditor(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can remove editors
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can remove editors", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "editor-users",
    pubkey,
    "remove",
  );
}

async function handleAddAdmin(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can add other admins
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can add other admins", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "admin-users",
    pubkey,
    "add",
  );
}

async function handleRemoveAdmin(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can remove other admins
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can remove other admins", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  // Prevent removing yourself if you're the last admin
  const { adminUsers } = await fetchNostrSets();
  if (adminUsers.length === 1 && adminUsers.includes(authResult.pubkey)) {
    return ErrorResponse(undefined, "Cannot remove the last admin", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "admin-users",
    pubkey,
    "remove",
  );
}

async function handleAddNews(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  currentNews: NewsTag[],
  data: AddNewsPayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can add news
  if (
    !authResult.roles.includes("editor") &&
    !authResult.roles.includes("admin")
  ) {
    return ErrorResponse(
      undefined,
      "Only editors and admins can add news",
      403,
    );
  }

  const { eventId, relay } = data;

  if (!eventId) {
    return ErrorResponse(undefined, "Event ID is required", 400);
  }

  if (!relay) {
    return ErrorResponse(undefined, "Relay is required", 400);
  }

  return await addNews(masterAdminPrivateKey, currentNews, data);
}

async function handleAddArticle(
  masterAdminPrivateKey: string,
  authResult: AuthResult,
  currentArticles: ArticleTag[],
  data: AddArticlePayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can add articles
  if (
    !authResult.roles.includes("editor") &&
    !authResult.roles.includes("admin")
  ) {
    return ErrorResponse(
      undefined,
      "Only editors and admins can add articles",
      403,
    );
  }

  let aTag: string;
  let relayTag: string;

  // Parse article information from either naddr or individual components
  if (data.type === "naddr") {
    try {
      const decoded = nip19.decode(data.naddr);
      if (decoded.type !== "naddr") {
        return ErrorResponse(undefined, "Invalid naddr format", 400);
      }

      const { kind, pubkey, identifier, relays } = decoded.data;
      aTag = `${kind}:${pubkey}:${identifier}`;

      if (!relays || relays.length === 0) {
        return ErrorResponse(undefined, "relay is empty for naddr", 400);
      }

      relayTag = relays[0];
    } catch {
      return ErrorResponse(undefined, "Failed to decode naddr", 400);
    }
  } else if (data.type === "a") {
    aTag = data.a;
    relayTag = data.relay;
  } else {
    return ErrorResponse(undefined, "Either naddr or a tag is required", 400);
  }

  // Validate a tag format
  const aTagParts = aTag.split(":");
  if (aTagParts.length !== 3) {
    return ErrorResponse(
      undefined,
      "Invalid a tag format. Must be kind:pubkey:identifier",
      400,
    );
  }

  return await addArticle(
    masterAdminPrivateKey,
    currentArticles,
    aTag,
    relayTag,
  );
}

/**
 * Update Nostr user set (admin-users or editor-users)
 */
async function updateNostrUserSet(
  masterPrivateKey: string,
  setType: "admin-users" | "editor-users",
  pubkey: string,
  operation: "add" | "remove",
): Promise<Response> {
  try {
    if (!masterPrivateKey) {
      return ErrorResponse(
        undefined,
        "Master admin private key not configured",
        500,
      );
    }

    // Fetch current user set
    const currentEvents: NostrEvent[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout fetching ${setType} set`));
      }, 10000);

      pool.subscribeManyEose(
        ADMIN_RELAYS,
        [
          {
            authors: [MASTER_ADMIN_PUBKEY],
            kinds: [30000],
            "#d": [setType],
            limit: 1,
          },
        ],
        {
          onevent(evt) {
            currentEvents.push(evt);
          },
          onclose() {
            clearTimeout(timeout);
            resolve();
          },
        },
      );
    });

    pool.close(ADMIN_RELAYS);

    // Get existing users
    let existingUsers: string[] = [];
    if (currentEvents.length > 0) {
      const latestEvent = currentEvents.sort(
        (a, b) => b.created_at - a.created_at,
      )[0];
      existingUsers = latestEvent.tags
        .filter((tag: string[]) => tag[0] === "p")
        .map((tag: string[]) => tag[1])
        .filter(Boolean);
    }

    // Update user list
    let updatedUsers: string[];
    if (operation === "add") {
      if (existingUsers.includes(pubkey)) {
        return ErrorResponse(
          undefined,
          `User already exists in ${setType}`,
          400,
        );
      }

      updatedUsers = [...existingUsers, pubkey];
    } else {
      updatedUsers = existingUsers.filter((p) => p !== pubkey);
    }

    // Create new event
    const eventTemplate = {
      kind: 30000,
      pubkey: MASTER_ADMIN_PUBKEY,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", setType], ...updatedUsers.map((user) => ["p", user])],
      content: "",
    };

    // Sign and publish
    const signedEvent = finalizeEvent(
      eventTemplate,
      hexToBytes(masterPrivateKey),
    );

    const result = await Promise.allSettled(
      pool.publish(ADMIN_RELAYS, signedEvent),
    );

    const actionText = operation === "add" ? "added to" : "removed from";

    return SuccessResponse({
      message: `User ${actionText} ${setType} successfully`,
      pubkey,
      setType,
      operation,
      totalUsers: updatedUsers.length,
      result,
    });
  } catch (error) {
    console.error(`Error updating ${setType}:`, error);

    return ErrorResponse(error, `Failed to update ${setType}`);
  }
}

async function addNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: AddNewsPayload,
) {
  if (!masterPrivateKey) {
    return ErrorResponse(
      undefined,
      "Master admin private key not configured",
      500,
    );
  }

  const eventTemplate = {
    kind: 30004,
    pubkey: MASTER_ADMIN_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ...currentNews.map((n) => ["e", n.eTag, n.relay]),
      ["e", data.eventId, data.relay],
    ],
    content: "",
  };

  const signedEvent = finalizeEvent(
    eventTemplate,
    hexToBytes(masterPrivateKey),
  );

  const result = await Promise.allSettled(
    ADMIN_RELAYS.map((relay) => {
      const r = new Relay(relay);
      r.connect();

      return r
        .publish(signedEvent)
        .then((result) => {
          return {
            status: "success",
            relay,
            result,
          };
        })
        .catch((error) => {
          return {
            status: "error",
            relay,
            error,
          };
        });
    }),
  );

  return SuccessResponse({
    message: "News added successfully",
    eventId: signedEvent.id,
    result,
  });
}

async function addArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  aTag: string,
  relayTag: string,
) {
  if (!masterPrivateKey) {
    return ErrorResponse(
      undefined,
      "Master admin private key not configured",
      500,
    );
  }

  const eventTemplate = {
    kind: 30004,
    pubkey: MASTER_ADMIN_PUBKEY,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ...currentArticles.map((a) => ["a", a.aTag, a.relay]),
      ["a", aTag, relayTag],
    ],
    content: "",
  };

  const signedEvent = finalizeEvent(
    eventTemplate,
    hexToBytes(masterPrivateKey),
  );

  const result = await Promise.allSettled(
    pool.publish(ADMIN_RELAYS, signedEvent),
  );

  return SuccessResponse({
    message: "Article added successfully",
    aTag,
    relayTag,
    eventId: signedEvent.id,
    result,
  });
}
