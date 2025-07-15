import type { NostrEvent } from "nostr-tools";
import { verifyEvent, SimplePool } from "nostr-tools";

import type { AuthResult, UserRole } from "./types";

export const pool = new SimplePool();
pool.trackRelays = true;

export function ErrorResponse(
  e?: Error,
  message?: string,
  status: number = 500,
) {
  return new Response(
    JSON.stringify({
      success: false,
      message:
        message ||
        (e instanceof Error ? e.message : "Error processing request"),
      error: e instanceof Error ? e.message : "Unknown error",
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

export function SuccessResponse(
  data: Record<string, unknown>,
  status: number = 200,
) {
  return new Response(
    JSON.stringify({
      success: true,
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

export function CorsResponse() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
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
  articles: ArticleTag[];
  news: NewsTag[];
};

/**
 * Fetch admin and editor user sets from Nostr relays
 */
export async function fetchNostrSets(): Promise<FetchNostrSetsResult> {
  const events: NostrEvent[] = await fetchSets();

  console.log(events.length);

  let adminUsers: string[] = [];
  let editorUsers: string[] = [];
  let articles: ArticleTag[] = [];
  let news: NewsTag[] = [];

  // Parse the events to extract pubkeys from sets
  events.forEach((event) => {
    const dTag = event.tags.find((tag) => tag[0] === "d")?.[1];

    if (dTag === "admin-users") {
      // Extract pubkeys from 'p' tags
      adminUsers = event.tags
        .filter((tag) => tag[0] === "p")
        .map((tag) => tag[1])
        .filter(Boolean);
    } else if (dTag === "editor-users") {
      // Extract pubkeys from 'p' tags
      editorUsers = event.tags
        .filter((tag) => tag[0] === "p")
        .map((tag) => tag[1])
        .filter(Boolean);
    } else if (dTag === "articles") {
      articles = event.tags
        .filter((tag) => tag[0] === "a")
        .map((tag) => ({ aTag: tag[1], relay: tag[2] }));
    } else if (dTag === "news") {
      news = event.tags
        .filter((tag) => tag[0] === "e")
        .map((tag) => ({ eTag: tag[1], relay: tag[2] }));
    }
  });

  return { adminUsers, editorUsers, articles, news };
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

export const MASTER_ADMIN_PUBKEY =
  "5fb571abb0a02ff241fc6090437ef1516157c66e03918ac519befea6475b72df";

const fetchSets = async (): Promise<NostrEvent[]> => {
  return Promise.all([
    pool.get(ADMIN_RELAYS, {
      authors: [MASTER_ADMIN_PUBKEY],
      kinds: [30000],
      "#d": ["admin-users"],
    }),
    pool.get(ADMIN_RELAYS, {
      authors: [MASTER_ADMIN_PUBKEY],
      kinds: [30000],
      "#d": ["editor-users"],
    }),
    pool.get(ADMIN_RELAYS, {
      authors: [MASTER_ADMIN_PUBKEY],
      kinds: [30004],
      "#d": ["articles"],
    }),
    pool.get(ADMIN_RELAYS, {
      authors: [MASTER_ADMIN_PUBKEY],
      kinds: [30004],
      "#d": ["news"],
    }),
  ]).then((e) => e.filter((e) => e !== null));
};
