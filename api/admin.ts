import { hexToBytes } from "@noble/hashes/utils";
import type { NostrEvent } from "nostr-tools";
import {
  finalizeEvent,
  nip19,
  Relay,
  SimplePool,
  verifyEvent,
} from "nostr-tools";

import { ErrorResponse, SuccessResponse } from "./bitcoin-stats/mempool";

export type PublishEventResponse = {
  message: string;
  result: PublishToRelaysResult[];
};

function PublishEventResponse(
  response: PublishEventResponse,
  data: Record<string, unknown> = {},
  status: number = 200,
) {
  return new Response(
    JSON.stringify({
      success: response.result.some((r) => r.success),
      ...response,
      ...data,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}

export interface Context {
  request: Request;
  env: {
    MASTER_ADMIN_PRIVATEKEY: string;
  };
}

export type UserRole = "admin" | "editor";

export interface AuthContext {
  env: {
    MASTER_ADMIN_PRIVATEKEY: string;
  };
}

export type AuthResult =
  | {
      success: true;
      pubkey: string;
      roles: UserRole[];
    }
  | {
      success: false;
      error: string;
      status: number;
    };

export type ArticleTag = {
  aTag: string;
  relay: string;
};

export type NewsTag = {
  eTag: string;
  relay: string;
};

export type FetchNostrSetsResult = {
  adminUsers: string[];
  editorUsers: string[];
  articleTags: ArticleTag[];
  newsTags: NewsTag[];
};

export type PublishToRelaysResult =
  | { success: true; relay: string }
  | { success: false; relay: string; error: string };

export function publishToRelays(
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

export const ADMIN_RELAYS = [
  "wss://relay.nostr.band",
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
  "wss://nostr.bitcoiner.social",
  "wss://nostr.mom",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.nos.social",
];

// Master admin public key (derived from private key)
export const MASTER_ADMIN_PUBKEY =
  "5fb571abb0a02ff241fc6090437ef1516157c66e03918ac519befea6475b72df";

export const pool = new SimplePool();
pool.trackRelays = true;

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
    const authResult: AuthResult = await authenticateNIP98(
      request.headers.get("Authorization") || "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (authResult.success !== true) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const requestBody = await request.json();
    const { action } = requestBody;

    switch (action) {
      case "trigger-deploy":
        return handleTriggerDeploy(request);
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
      case "publish-news":
        return handlePublishNews(
          masterAdminPrivateKey,
          newsTags,
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

type PublishNewsPayload = {
  action: "publish-news";
  content: string;
  title: string;
  category: string;
  summary?: string;
  image?: string;
  tags: string[];
};

/** Editor Handlers */

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
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can add news", 403);
  }

  const { eventId, relay } = data;

  if (!eventId || !relay) {
    return ErrorResponse(undefined, "Event ID and relay are required", 400);
  }

  // Check if news already exists
  const existingNews = currentNews.find(
    (news) => news.eTag === data.eventId && news.relay === data.relay,
  );

  if (existingNews) {
    return ErrorResponse(undefined, "News already exists", 409);
  }

  try {
    const result = await addNews(masterAdminPrivateKey, currentNews, data);

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
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can remove news", 403);
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
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can remove articles", 403);
  }

  const { aTag, relay } = data;
  if (!aTag || !relay) {
    return ErrorResponse(undefined, "Article data is required", 400);
  }

  return await removeArticle(masterAdminPrivateKey, currentArticles, data);
}

async function handlePublishNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: PublishNewsPayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can publish news
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can publish news", 403);
  }

  const { content, title, category } = data;
  if (!content || !title || !category) {
    return ErrorResponse(
      undefined,
      "Content, title, and category are required",
      400,
    );
  }

  return await publishNews(
    masterAdminPrivateKey,
    currentNews,
    authResult.pubkey,
    data,
  );
}

/** Editor Actions */

async function addNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: AddNewsPayload,
) {
  const privateKeyBytes = hexToBytes(masterPrivateKey);
  const currentTime = Math.floor(Date.now() / 1000);

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

  return await publishToRelays(event, ADMIN_RELAYS);
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

async function publishNews(
  masterPrivateKey: string,
  currentNews: NewsTag[],
  userPubkey: string,
  data: PublishNewsPayload,
): Promise<Response> {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Prepare tags for the kind 1 event
    const eventTags = [
      ["title", data.title],
      ["category", data.category],
      ["editor", userPubkey],
      ...data.tags.map((tag) => ["t", tag]),
    ];

    // Add optional tags if provided
    if (data.summary) {
      eventTags.push(["summary", data.summary]);
    }

    if (data.image) {
      eventTags.push(["image", data.image]);
    }

    // Create the kind 1 event
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
        {
          message: "News published successfully",
          result,
        },
        { eventId: event.id, relay, addNewsResult },
      );
    }

    return ErrorResponse(undefined, "Failed to publish news", 500);
  } catch (error) {
    console.error("Error publishing news:", error);

    return ErrorResponse(error);
  }
}

async function handleTriggerDeploy(request: Request) {
  try {
    const { adminUsers, editorUsers } = await fetchNostrSets([
      "admin-users",
      "editor-users",
    ]);

    // Authenticate user - require editor role for deployment
    const authResult = await authenticateNIP98(
      request.headers.get("Authorization") ?? "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (authResult.success !== true) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    // All checks passed, trigger the deployment
    const deployHookUrl =
      "https://api.vercel.com/v1/integrations/deploy/prj_MgZWqBPzwJKbsZCUAy4r45WVHVpK/6EPluOk49C";

    const response = await fetch(deployHookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return SuccessResponse({
        message: "Deploy hook triggered successfully",
        status: response.status,
        authorizedBy: authResult.pubkey,
        userRoles: authResult.roles,
      });
    } else {
      return ErrorResponse(
        undefined,
        "Failed to trigger deploy hook",
        response.status,
      );
    }
  } catch (error) {
    return ErrorResponse(error);
  }
}

/** Admin Handlers */

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

/** Admin Actions */

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

/**
 * Authenticate using NIP-98 Nostr auth scheme and check roles from Nostr events
 */
export async function authenticateNIP98(
  authHeader: string,
  adminUsers: string[],
  editorUsers: string[],
  requiredRoles: UserRole[],
): Promise<AuthResult> {
  try {
    // Get the Authorization header
    if (!authHeader || !authHeader.startsWith("Nostr ")) {
      return {
        success: false,
        error: "Missing or invalid Authorization header",
        status: 401,
      };
    }

    // Parse the Nostr event from the Authorization header
    let nostrEvent: NostrEvent;
    try {
      const eventBase64 = authHeader.slice(6); // Remove 'Nostr ' prefix
      const eventJson = atob(eventBase64);
      nostrEvent = JSON.parse(eventJson);
    } catch {
      return {
        success: false,
        error: "Invalid Nostr event format",
        status: 401,
      };
    }

    // Verify the event signature
    if (!verifyEvent(nostrEvent)) {
      return {
        success: false,
        error: "Invalid event signature",
        status: 401,
      };
    }

    // Verify the event is for the correct method (NIP-98)
    const urlTag = nostrEvent.tags.find((tag) => tag[0] === "u");
    const methodTag = nostrEvent.tags.find((tag) => tag[0] === "method");

    if (!urlTag || !methodTag) {
      return {
        success: false,
        error: "Invalid NIP-98 auth event - missing required tags",
        status: 401,
      };
    }

    // Check if the event is not too old (within 10 minutes)
    const eventTime = nostrEvent.created_at;
    const currentTime = Math.floor(Date.now() / 1000);
    const maxAge = 10 * 60; // 10 minutes

    if (currentTime - eventTime > maxAge) {
      return {
        success: false,
        error: "Auth event is too old",
        status: 401,
      };
    }

    // Get user roles from Nostr events
    const userRoles = await getUserRolesFromNostr(
      nostrEvent.pubkey,
      adminUsers,
      editorUsers,
    );

    const hasRequiredRole = requiredRoles.some((role) =>
      userRoles.includes(role),
    );

    if (!hasRequiredRole) {
      const requiredRolesString = requiredRoles.join(" or ");
      const userRolesString = userRoles.join(", ");

      return {
        success: false,
        error: `Insufficient permissions. Required: ${requiredRolesString}. Has: ${userRolesString}`,
        status: 403,
      };
    }

    return {
      success: true,
      pubkey: nostrEvent.pubkey,
      roles: userRoles,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication error",
      status: 500,
    };
  }
}

/**
 * Fetch Nostr sets for admin users, editor users, articles, and news
 */
export async function fetchNostrSets(
  sets: EventSet[],
): Promise<FetchNostrSetsResult> {
  try {
    let adminUsers: string[] = [];
    let editorUsers: string[] = [];
    let articleTags: ArticleTag[] = [];
    let newsTags: NewsTag[] = [];

    // Fetch admin users set
    const eventResults: Map<EventSet, NostrEvent> = await fetchSets(sets);

    for (const [set, event] of eventResults) {
      if (set === "admin-users") {
        adminUsers = event.tags
          .filter((tag) => tag[0] === "p" && tag[1])
          .map((tag) => tag[1]);
      }

      if (set === "editor-users") {
        editorUsers = event.tags
          .filter((tag) => tag[0] === "p" && tag[1])
          .map((tag) => tag[1]);
      }

      if (set === "articles") {
        articleTags = event.tags
          .filter((tag) => tag[0] === "a" && tag[1] && tag[2])
          .map((tag) => ({
            aTag: tag[1],
            relay: tag[2],
          }));
      }

      if (set === "news") {
        newsTags = event.tags
          .filter((tag) => tag[0] === "e" && tag[1] && tag[2])
          .map((tag) => ({
            eTag: tag[1],
            relay: tag[2],
            pubkey: event.pubkey,
          }));
      }
    }

    return {
      adminUsers,
      editorUsers,
      articleTags: articleTags,
      newsTags: newsTags,
    };
  } catch (error) {
    console.error("Error fetching Nostr sets:", error);

    throw error;
  }
}

/**
 * Get user roles from Nostr events
 */
export async function getUserRolesFromNostr(
  pubkey: string,
  adminUsers: string[],
  editorUsers: string[],
): Promise<UserRole[]> {
  const roles: UserRole[] = [];

  try {
    if (adminUsers.includes(pubkey)) {
      roles.push("admin");
    }

    if (editorUsers.includes(pubkey)) {
      roles.push("editor");
    }
  } catch (error) {
    console.error("Error getting user roles from Nostr:", error);

    throw error;
  }

  return roles;
}

function getEventSetType(set: EventSet, type: "follow" | "curation"): boolean {
  return set === "admin-users" || set === "editor-users"
    ? type === "follow"
    : type === "curation";
}

export type EventSet = "admin-users" | "editor-users" | "articles" | "news";

const fetchSets = async (
  sets: EventSet[],
): Promise<Map<EventSet, NostrEvent>> => {
  const hasFollowSet = sets.some((set) => getEventSetType(set, "follow"));
  const hasCurationSet = sets.some((set) => getEventSetType(set, "curation"));

  const kinds: number[] = [
    hasFollowSet ? 30000 : null,
    hasCurationSet ? 30004 : null,
  ].filter(Boolean) as number[];

  return new Promise((resolve, reject) => {
    const events = new Map<EventSet, NostrEvent>();

    // Use the correct nostr-tools API for fetching events
    pool.subscribeEose(
      ADMIN_RELAYS,
      {
        kinds,
        authors: [MASTER_ADMIN_PUBKEY],
        "#d": sets,
      },
      {
        onevent(evt) {
          const dTag = evt.tags.find((tag) => tag[0] === "d")?.[1];

          if (!dTag) {
            return;
          }

          if (!sets.includes(dTag as EventSet)) {
            return;
          }

          if (events.has(dTag as EventSet)) {
            // check if the event in the map is newer
            const existingEvent = events.get(dTag as EventSet);

            if (existingEvent && existingEvent.created_at > evt.created_at) {
              return;
            }
          }

          events.set(dTag as EventSet, evt);
        },
        onclose() {
          if (events.size === sets.length) {
            resolve(events);
          } else {
            reject(new Error("Not all events received"));
          }
        },
      },
    );
  });
};
