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
      pubkey: event.pubkey,
    });

    return {
      pubkey: profile.pubkey,
      display_name: profile.display_name || profile.name,
      website: profile.website,
      picture: profile.picture,
      about: profile.about,
      nip05: profile.nip05,
      lud06: profile.lud06,
      lud16: profile.lud16,
    };
  } catch {
    return null;
  }
};

export const ProfileItemSchema = z.object({
  pubkey: z.string(),
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
