import type { NostrEvent } from "nostr-tools";
import { z } from "zod";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import { pool } from "./utils";

const cache = getCache();

export async function getKind0Events(
  authors: string[],
  onUpdate: (pubkey: string, event: NostrEvent) => void,
  onclose: (reasons: string[]) => void,
) {
  authors.forEach((author) => {
    const cachedEvent = cache.getKind0Event(author);

    if (cachedEvent) {
      onUpdate(author, cachedEvent);
    }
  });

  pool.subscribeEose(
    PROFILE_RELAYS,
    {
      authors: authors,
      kinds: [0],
    },
    {
      onevent: (event) => {
        const cachedEvent = cache.getKind0Event(event.pubkey);

        if (cachedEvent && event.created_at < cachedEvent.created_at) {
          // nothing to update
          return;
        }

        if (cachedEvent && event.id === cachedEvent.id) {
          // nothing to update
          return;
        }

        cache.setKind0Event(event.pubkey, event);

        onUpdate(event.pubkey, event);
      },
      onclose,
    },
  );
}

// Helper function to parse kind 0 profile event
export const parseProfileEvent = (event: NostrEvent): ProfileItem | null => {
  try {
    const content = JSON.parse(event.content);

    const profile = ProfileItemSchema.parse({
      ...content,
      created_at: event.created_at,
      pubkey: event.pubkey,
    });

    return {
      pubkey: profile.pubkey,
      created_at: event.created_at,
      display_name: profile.display_name || profile.name,
      website: profile.website,
      picture: profile.picture,
      about: profile.about,
      nip05: profile.nip05,
      lud06: profile.lud06,
      lud16: profile.lud16,
    };
  } catch {
    console.error("Profile parse error", event);

    return null;
  }
};

export const ProfileItemSchema = z.object({
  pubkey: z.string(),
  created_at: z.number(),
  name: z.string().optional(),
  display_name: z.string().optional(),
  picture: z.string().optional(),
  about: z.string().optional(),
  website: z.string().optional(),
  nip05: z.string().optional(),
  lud06: z.string().optional(),
  lud16: z.string().optional(),
});

export type ProfileItem = z.infer<typeof ProfileItemSchema>;

// New optimized function that works with ProfileItem cache
export function getProfiles(
  authors: string[],
  onUpdate: (pubkey: string, profile: ProfileItem) => void,
  onclose: (reasons: string[]) => void,
) {
  // First check cache and immediately return cached ProfileItem objects
  authors.forEach((author) => {
    const cachedProfile = cache.getProfileItem(author);
    if (cachedProfile) {
      onUpdate(author, cachedProfile);
    }
  });

  // Use subscribe instead of subscribeEose to keep connection open
  const sub = pool.subscribe(
    PROFILE_RELAYS,
    {
      authors: authors,
      kinds: [0],
    },
    {
      alreadyHaveEvent(id) {
        const cachedProfile = cache.getProfileItem(id);

        if (cachedProfile) {
          return true;
        }

        return false;
      },
      onevent: (event) => {
        const cachedProfile = cache.getProfileItem(event.pubkey);

        // Parse the new event
        const newProfile = parseProfileEvent(event);

        if (!newProfile) {
          return; // Skip invalid profiles
        }

        // Compare created_at timestamps if we have a cached profile
        if (
          cachedProfile &&
          newProfile.created_at <= cachedProfile.created_at
        ) {
          return; // Skip older or same profile
        }

        // Cache the new ProfileItem and notify
        cache.setProfileItem(event.pubkey, newProfile);

        onUpdate(event.pubkey, newProfile);
      },
      oneose: () => {
        // Connection stays open for real-time updates
      },
      onclose,
    },
  );

  // Return cleanup function
  return () => {
    sub.close();
  };
}
