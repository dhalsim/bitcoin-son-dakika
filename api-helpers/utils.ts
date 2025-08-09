import { verifyEvent, SimplePool } from "nostr-tools";

import type { EventItem } from "@/lib/nip01.js";
import type { PublishToRelaysResult } from "@/lib/utils.js";

import type { AuthResult, UserRole } from "./types.js";

export const pool = new SimplePool();

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

export const PROFILE_RELAYS = [
  "wss://purplepag.es",
  "wss://relay.nos.social",
  "wss://user.kindpag.es",
  "wss://relay.nostr.band",
];

// Master admin public key (derived from private key)
export const MASTER_ADMIN_PUBKEY =
  "5fb571abb0a02ff241fc6090437ef1516157c66e03918ac519befea6475b72df";

export function ErrorResponse(e?: Error, message?: string, status: number = 500) {
  return new Response(
    JSON.stringify({
      success: false,
      message: message || (e instanceof Error ? e.message : "Error processing request"),
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

export type PublishEventResponse = {
  message: string;
  result: PublishToRelaysResult[];
};

export function PublishEventResponse(
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

export function SuccessResponse(data: Record<string, unknown>, status: number = 200) {
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
    let nostrEvent: EventItem;
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
    const userRoles = await getUserRolesFromNostr(nostrEvent.pubkey, adminUsers, editorUsers);

    const hasRequiredRole = requiredRoles.some((role) => userRoles.includes(role));

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
  articleTags: ArticleTag[];
  newsTags: NewsTag[];
};

/**
 * Fetch Nostr sets for admin users, editor users, articles, and news
 */
export async function fetchNostrSets(sets: EventSet[]): Promise<FetchNostrSetsResult> {
  try {
    let adminUsers: string[] = [];
    let editorUsers: string[] = [];
    let articleTags: ArticleTag[] = [];
    let newsTags: NewsTag[] = [];

    // Fetch admin users set
    const eventResults: Map<EventSet, EventItem> = await fetchSets(sets);

    for (const [set, event] of eventResults) {
      if (set === "admin-users") {
        adminUsers = event.tags.filter((tag) => tag[0] === "p" && tag[1]).map((tag) => tag[1]);
      }

      if (set === "editor-users") {
        editorUsers = event.tags.filter((tag) => tag[0] === "p" && tag[1]).map((tag) => tag[1]);
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

function getEventSetType(set: EventSet, type: "follow" | "curation"): boolean {
  return set === "admin-users" || set === "editor-users" ? type === "follow" : type === "curation";
}

export type EventSet = "admin-users" | "editor-users" | "articles" | "news";

const fetchSets = async (sets: EventSet[]): Promise<Map<EventSet, EventItem>> => {
  const hasFollowSet = sets.some((set) => getEventSetType(set, "follow"));
  const hasCurationSet = sets.some((set) => getEventSetType(set, "curation"));

  const kinds = [hasFollowSet ? 30000 : null, hasCurationSet ? 30004 : null].filter(Boolean);

  return new Promise((resolve, reject) => {
    const events = new Map<EventSet, EventItem>();
    const receivedEventRelayMap = new Map<string, string>();

    // Use the correct nostr-tools API for fetching events
    const sub = pool.subscribe(
      ADMIN_RELAYS,
      {
        kinds,
        authors: [MASTER_ADMIN_PUBKEY],
        "#d": sets,
      },
      {
        receivedEvent(relay, id) {
          receivedEventRelayMap.set(id, relay.url);
        },
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

          const relay = receivedEventRelayMap.get(evt.id);

          if (!relay) {
            console.error("Received event from unknown relay", evt);

            return;
          }

          events.set(dTag as EventSet, { ...evt, relay });
        },
        oneose() {
          if (events.size === sets.length) {
            resolve(events);
          } else {
            reject(new Error("Not all events received"));
          }

          sub.close();
        },
      },
    );
  });
};

/**
 * Cache utilities for Vercel Edge Functions
 * Implements different caching strategies based on data type and volatility
 */

export interface CacheConfig {
  maxAge: number; // Primary cache duration in seconds
  staleWhileRevalidate: number; // How long to serve stale content while revalidating
  cdnMaxAge?: number; // CDN-specific cache duration
}

export function applyCacheHeaders(response: Response, strategy: CacheConfig): Response {
  const cacheControl = `s-maxage=${strategy.maxAge}, stale-while-revalidate=${strategy.staleWhileRevalidate}`;

  response.headers.set("Cache-Control", cacheControl);
  response.headers.set("CDN-Cache-Control", `s-maxage=${strategy.cdnMaxAge || strategy.maxAge}`);

  // Add ETag for better cache validation
  const etag = `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`;
  response.headers.set("ETag", etag);

  return response;
}
