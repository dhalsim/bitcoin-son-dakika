import type { NostrEvent } from "nostr-tools";
import { verifyEvent, SimplePool } from "nostr-tools";

import type { AuthResult, UserRole } from "./types.js";

export const pool = new SimplePool();
pool.trackRelays = true;

// Nostr relays for admin operations
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
 * Fetch Nostr sets for admin users, editor users, articles, and news
 */
export async function fetchNostrSets(
  sets: EventSet[],
): Promise<FetchNostrSetsResult> {
  try {
    let adminUsers: string[] = [];
    let editorUsers: string[] = [];
    let articles: ArticleTag[] = [];
    let news: NewsTag[] = [];

    // Fetch admin users set
    const eventResults: EventResult[] = await fetchSets(sets);

    for (const resultItem of eventResults) {
      if (resultItem.set === "admin-users") {
        adminUsers = resultItem.event.tags
          .filter((tag) => tag[0] === "p" && tag[1])
          .map((tag) => tag[1]);
      }

      if (resultItem.set === "editor-users") {
        editorUsers = resultItem.event.tags
          .filter((tag) => tag[0] === "p" && tag[1])
          .map((tag) => tag[1]);
      }

      if (resultItem.set === "articles") {
        articles = resultItem.event.tags
          .filter((tag) => tag[0] === "a" && tag[1] && tag[2])
          .map((tag) => ({ aTag: tag[1], relay: tag[2] }));
      }

      if (resultItem.set === "news") {
        news = resultItem.event.tags
          .filter((tag) => tag[0] === "e" && tag[1] && tag[2])
          .map((tag) => ({ eTag: tag[1], relay: tag[2] }));
      }
    }

    return {
      adminUsers,
      editorUsers,
      articles,
      news,
    };
  } catch (error) {
    console.error("Error fetching Nostr sets:", error);

    throw error;
  }
}

function getEventSetType(set: EventSet, type: "follow" | "curation"): boolean {
  return set === "admin-users" || set === "editor-users"
    ? type === "follow"
    : type === "curation";
}

export type EventSet = "admin-users" | "editor-users" | "articles" | "news";

type EventResult = {
  event: NostrEvent;
  set: EventSet;
};

const fetchSets = async (sets: EventSet[]): Promise<EventResult[]> => {
  const hasFollowSet = sets.some((set) => getEventSetType(set, "follow"));
  const hasCurationSet = sets.some((set) => getEventSetType(set, "curation"));

  const kinds = [
    hasFollowSet ? 30000 : null,
    hasCurationSet ? 30004 : null,
  ].filter(Boolean);

  return new Promise((resolve) => {
    const events: EventResult[] = [];

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
          events.push({
            event: evt,
            set: evt.tags.find((tag) => tag[0] === "d")?.[1] as EventSet,
          });

          if (events.length === sets.length) {
            resolve(events);
          }
        },
      },
    );
  });
};
