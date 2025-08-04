import type { NostrEvent } from "nostr-tools";
import { z } from "zod";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import { logCloseReasons, pool } from "./utils";

const cache = getCache();

export const parseProfileEvent = (
  event: NostrEvent,
  relay: string,
): ProfileItem | null => {
  try {
    const content = JSON.parse(event.content);

    const profile = ProfileItemSchema.parse({
      ...content,
      created_at: event.created_at,
      pubkey: event.pubkey,
      relay,
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
  cachedProfiles: Map<string, ProfileItem>;
  onUpdate: (profiles: Map<string, ProfileItem>) => void;
};

// New optimized function that works with ProfileItem cache
export function getProfiles({
  authors,
  cachedProfiles,
  onUpdate,
}: GetProfilesParams) {
  const receivedEventRelayMap = new Map<string, string>();
  const newProfiles = new Map<string, ProfileItem>();

  // Use subscribe instead of subscribeEose to keep connection open
  const sub = pool.subscribe(
    PROFILE_RELAYS,
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

        // Parse the new event
        const newProfile = parseProfileEvent(event, relay);

        // Skip invalid profiles
        if (!newProfile) {
          return;
        }

        newProfiles.set(event.pubkey, newProfile);
        cachedProfiles.set(event.pubkey, newProfile);
      },
      oneose: () => {
        if (newProfiles.size) {
          onUpdate(new Map(newProfiles));
          newProfiles.clear();

          cache.setProfileItems(cachedProfiles);
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
