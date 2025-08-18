import type { NostrEvent } from "nostr-tools";
import { z } from "zod";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import type { Nip65Relays } from "./nip65";
import { Nip65RelaysSchema } from "./nip65";
import { logCloseReasons, pool } from "./utils";

export const parseProfileEvent = (
  event: NostrEvent,
  relay: string,
  nip65: Nip65Relays | null,
): ProfileItem | null => {
  try {
    const content = JSON.parse(event.content);

    const profile = ProfileItemSchema.parse({
      ...content,
      created_at: event.created_at,
      pubkey: event.pubkey,
      relay,
      nip65,
    });

    return profile;
  } catch (error) {
    console.error("Profile parse error", event, error);

    return null;
  }
};

export const ProfileItemSchema = z.object({
  pubkey: z.string(),
  relay: z.string(),
  created_at: z.number(),
  nip65: Nip65RelaysSchema.nullable(),
  name: z.string().optional().nullable(),
  display_name: z.string().optional().nullable(),
  picture: z.string().optional().nullable(),
  about: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  nip05: z.string().optional().nullable(),
  lud06: z.string().optional().nullable(),
  lud16: z.string().optional().nullable(),
});

export type ProfileItem = z.infer<typeof ProfileItemSchema>;

export type EventItem = NostrEvent & {
  relay: string;
};

export type GetProfilesParams = {
  authors: string[];
  relayHints?: string[];
  nip65Map?: Map<string, Nip65Relays>;
  onUpdate: (profiles: Map<string, ProfileItem> | null) => void;
};

const cache = getCache();

// New optimized function that works with ProfileItem cache
export function getProfiles({ authors, relayHints, nip65Map, onUpdate }: GetProfilesParams) {
  const cachedProfiles = getCache().getProfileItems();
  const receivedEventRelayMap = new Map<string, string>();
  const newProfiles = new Map<string, ProfileItem>();

  const foundCachedProfiles = new Map(
    authors
      .filter((author) => cachedProfiles.has(author))
      .map((author) => [author, cachedProfiles.get(author)]),
  );

  if (foundCachedProfiles.size > 0) {
    onUpdate(foundCachedProfiles);
  }

  let eoseCalled = false;

  const sub = pool.subscribe(
    relayHints?.length ? relayHints : PROFILE_RELAYS,
    {
      authors: authors,
      kinds: [0],
    },
    {
      receivedEvent: (relay, id) => {
        receivedEventRelayMap.set(id, relay.url);
      },
      onevent: (event) => {
        const relay = receivedEventRelayMap.get(event.id);

        if (!relay) {
          console.error("Received event from unknown relay", event);

          return;
        }

        const cachedProfile = cachedProfiles.get(event.pubkey);

        if (cachedProfile && cachedProfile.created_at > event.created_at) {
          // Skip older profiles
          return;
        }

        const nip65 = nip65Map?.get(event.pubkey) ?? null;

        // Parse the new event
        const newProfile = parseProfileEvent(event, relay, nip65);

        // Skip invalid profiles
        if (!newProfile) {
          return;
        }

        newProfiles.set(event.pubkey, newProfile);
        cachedProfiles.set(event.pubkey, newProfile);

        if (eoseCalled) {
          onUpdate(new Map(newProfiles));
          newProfiles.clear();

          const freshCachedProfiles = getCache().getProfileItems();

          freshCachedProfiles.set(event.pubkey, newProfile);

          cache.setProfileItems(freshCachedProfiles);
        }
      },
      oneose: () => {
        eoseCalled = true;

        if (newProfiles.size > 0) {
          onUpdate(new Map(newProfiles));
          newProfiles.clear();

          const freshCachedProfiles = getCache().getProfileItems();

          for (const [pubkey, profile] of newProfiles) {
            freshCachedProfiles.set(pubkey, profile);
          }

          cache.setProfileItems(freshCachedProfiles);
        }
      },
      onclose: logCloseReasons,
    },
  );

  // Return cleanup function
  return () => {
    sub.close();
  };
}

export function getKind1Events(
  relays: string[],
  ids: string[],
  onUpdate: (events: Map<string, EventItem>) => void,
) {
  const newEvents = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      ids,
      kinds: [1],
    },
    {
      receivedEvent: (relay, id) => {
        receivedEventRelayMap.set(id, relay.url);
      },
      onevent: (event) => {
        const relay = receivedEventRelayMap.get(event.id);

        if (!relay) {
          console.error("Received event from unknown relay", event);

          return;
        }

        newEvents.set(event.id, { ...event, relay });

        if (eoseCalled) {
          onUpdate(new Map(newEvents));
          newEvents.clear();
        }
      },
      oneose: () => {
        eoseCalled = true;

        if (newEvents.size) {
          onUpdate(new Map(newEvents));
          newEvents.clear();
        }
      },
      onclose: logCloseReasons,
    },
  );

  return () => {
    sub.close();
  };
}
