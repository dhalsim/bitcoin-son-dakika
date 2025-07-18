import { hexToBytes } from "@noble/hashes/utils";
import type { NostrEvent } from "nostr-tools";
import { finalizeEvent, nip19, Relay } from "nostr-tools";

import type { AuthResult } from "./types.js";
import type { ArticleTag, NewsTag, PublishToRelaysResult } from "./utils.js";
import {
  ErrorResponse,
  SuccessResponse,
  ADMIN_RELAYS,
  authenticateNIP98,
  fetchNostrSets,
  PublishEventResponse,
} from "./utils.js";

// Vercel Edge Function handler for GET requests
export async function GET(_request: Request) {
  try {
    // For GET requests, return public admin data (no authentication required for viewing)
    const { adminUsers, editorUsers, articleTags, newsTags } =
      await fetchNostrSets(["admin-users", "editor-users", "articles", "news"]);

    return SuccessResponse({
      adminUsers,
      editorUsers,
      articles: articleTags,
      news: newsTags,
    });
  } catch (error) {
    console.error("Admin GET error:", error);

    return ErrorResponse(error);
  }
}

// Vercel Edge Function handler for POST requests
export async function POST(request: Request) {
  const masterAdminPrivateKey = process.env.MASTER_ADMIN_PRIVATEKEY;

  if (!masterAdminPrivateKey) {
    return ErrorResponse(
      undefined,
      "Master admin private key not configured",
      500,
    );
  }

  try {
    const { adminUsers, editorUsers, articleTags, newsTags } =
      await fetchNostrSets(["admin-users", "editor-users", "articles", "news"]);

    console.log({
      adminUsers,
      editorUsers,
      articles: articleTags,
      news: newsTags,
    });

    // MANDATORY AUTHENTICATION for all POST actions
    const authResult = await authenticateNIP98(
      request.headers.get("Authorization") || "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const requestBody = await request.json();
    const { action } = requestBody;

    switch (action) {
      case "add-editor-pubkey":
        return handleAddEditor(
          masterAdminPrivateKey,
          editorUsers,
          authResult,
          requestBody,
        );
      case "remove-editor-pubkey":
        return handleRemoveEditor(
          masterAdminPrivateKey,
          editorUsers,
          authResult,
          requestBody,
        );
      case "add-admin-pubkey":
        return handleAddAdmin(
          masterAdminPrivateKey,
          adminUsers,
          authResult,
          requestBody,
        );
      case "remove-admin-pubkey":
        return handleRemoveAdmin(
          masterAdminPrivateKey,
          adminUsers,
          authResult,
          requestBody,
        );
      case "add-article":
        return handleAddArticle(
          masterAdminPrivateKey,
          articleTags,
          authResult,
          requestBody,
        );
      case "add-news":
        return handleAddNews(
          masterAdminPrivateKey,
          newsTags,
          authResult,
          requestBody,
        );
      case "remove-news":
        return handleRemoveNews(
          masterAdminPrivateKey,
          newsTags,
          authResult,
          requestBody,
        );
      case "remove-article":
        return handleRemoveArticle(
          masterAdminPrivateKey,
          articleTags,
          authResult,
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
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Helper functions for user management

// Action handlers
interface AdminActionData {
  pubkey?: string;
}

type AddArticlePayload =
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; a: string; relay: string };

type AddArticleResolvedPayload = {
  aTag: string;
  relayTag: string;
  action: "add-article";
};

type AddNewsPayload = {
  action: "add-news";
  eventId: string;
  relay: string;
};

type RemoveNewsPayload = {
  action: "remove-news";
  eventId: string;
  relay: string;
};

type RemoveArticlePayload = {
  action: "remove-article";
  aTag: string;
  relay: string;
};

async function handleAddEditor(
  masterAdminPrivateKey: string,
  editorUsers: string[],
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
    editorUsers,
    pubkey,
    "add",
  );
}

async function handleRemoveEditor(
  masterAdminPrivateKey: string,
  editorUsers: string[],
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
    editorUsers,
    pubkey,
    "remove",
  );
}

async function handleAddAdmin(
  masterAdminPrivateKey: string,
  currentAdminUsers: string[],
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
    currentAdminUsers,
    pubkey,
    "add",
  );
}

async function handleRemoveAdmin(
  masterAdminPrivateKey: string,
  currentAdminUsers: string[],
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

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "admin-users",
    currentAdminUsers,
    pubkey,
    "remove",
  );
}

async function handleAddNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
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

  if (!eventId || !relay) {
    return ErrorResponse(undefined, "Event ID and relay are required", 400);
  }

  return await addNews(masterAdminPrivateKey, currentNews, data);
}

async function handleRemoveNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: RemoveNewsPayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can remove news
  if (
    !authResult.roles.includes("editor") &&
    !authResult.roles.includes("admin")
  ) {
    return ErrorResponse(
      undefined,
      "Only editors and admins can remove news",
      403,
    );
  }

  const { eventId, relay } = data;
  if (!eventId || !relay) {
    return ErrorResponse(undefined, "Event ID and relay are required", 400);
  }

  return await removeNews(masterAdminPrivateKey, currentNews, data);
}

async function handleAddArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
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

async function handleRemoveArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
  data: RemoveArticlePayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can remove articles
  if (
    !authResult.roles.includes("editor") &&
    !authResult.roles.includes("admin")
  ) {
    return ErrorResponse(
      undefined,
      "Only editors and admins can remove articles",
      403,
    );
  }

  const { aTag, relay } = data;
  if (!aTag || !relay) {
    return ErrorResponse(undefined, "Article data is required", 400);
  }

  return await removeArticle(masterAdminPrivateKey, currentArticles, data);
}

function publishToRelays(
  event: NostrEvent,
  relayStrings: string[],
): Promise<PublishToRelaysResult[]> {
  return Promise.all(
    relayStrings.map(async (r) => {
      try {
        const relay = new Relay(r);

        await relay.connect();
        await relay.publish(event);

        return { success: true, relay: r };
      } catch (error) {
        return { success: false, relay: r, error: error.message };
      }
    }),
  );
}

async function updateNostrUserSet(
  masterPrivateKey: string,
  setType: "admin-users" | "editor-users",
  currentUsers: string[],
  pubkey: string,
  operation: "add" | "remove",
): Promise<Response> {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    const existingUser = currentUsers.find((u) => u === pubkey);

    if (operation === "add") {
      if (existingUser) {
        return ErrorResponse(undefined, "User already exists", 409);
      }
    } else {
      if (!existingUser) {
        return ErrorResponse(undefined, "User not found", 404);
      }
    }

    const updatedUserTags =
      operation === "add"
        ? [...currentUsers.map((u) => ["p", u]), ["p", pubkey]]
        : currentUsers.filter((u) => u !== pubkey).map((u) => ["p", u]);

    // Create the event template
    const eventTemplate = {
      kind: 30000,
      created_at: currentTime,
      tags: [["d", setType], ...updatedUserTags],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse(
      {
        message: `${operation === "add" ? "Added" : "Removed"} ${pubkey} from ${setType}`,
        result,
      },
      { pubkey, setType, operation },
    );
  } catch (error) {
    console.error("Error updating Nostr user set:", error);

    return ErrorResponse(error);
  }
}

async function addNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: AddNewsPayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if news already exists
    const existingNews = currentNews.find(
      (news) => news.eTag === data.eventId && news.relay === data.relay,
    );

    if (existingNews) {
      return ErrorResponse(undefined, "News already exists", 409);
    }

    // Create the event
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
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse(
      {
        message: `News added successfully`,
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error adding news:", error);

    return ErrorResponse(error);
  }
}

async function removeNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: RemoveNewsPayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Filter out the news item to be removed
    const toBeRemoved = currentNews.find((news) => news.eTag === data.eventId);

    // Check if the news item exists
    if (!toBeRemoved) {
      return ErrorResponse(undefined, "News item not found", 404);
    }

    // Create the event with the updated list
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

    return PublishEventResponse(
      {
        message: "News removed successfully",
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error removing news:", error);

    return ErrorResponse(error);
  }
}

async function addArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  data: AddArticleResolvedPayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if article already exists
    const existingArticle = currentArticles.find(
      (article) =>
        article.aTag === data.aTag && article.relay === data.relayTag,
    );

    if (existingArticle) {
      return ErrorResponse(undefined, "Article already exists", 409);
    }

    // Create the event
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

    return PublishEventResponse(
      {
        message: "Article added successfully",
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error adding article:", error);

    return ErrorResponse(error);
  }
}

async function removeArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  data: RemoveArticlePayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Filter out the article to be removed
    const toBeRemoved = currentArticles.find(
      (article) => article.aTag === data.aTag && article.relay === data.relay,
    );

    // Check if the article exists
    if (!toBeRemoved) {
      return ErrorResponse(undefined, "Article not found", 404);
    }

    // Create the event with the updated list
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

    return PublishEventResponse(
      {
        message: "Article removed successfully",
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error removing article:", error);

    return ErrorResponse(error);
  }
}
