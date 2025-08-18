import { z } from "zod";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

import { getCache } from "./cache";
import { pool } from "./utils";

export const Nip65RelaysSchema = z.object({
  readRelays: z.array(z.string()),
  writeRelays: z.array(z.string()),
  flatRelays: z.array(z.object({ relay: z.string(), read: z.boolean(), write: z.boolean() })),
});

export type Nip65Relays = z.infer<typeof Nip65RelaysSchema>;

function toReadWriteRelays(tags: string[][]): Nip65Relays {
  const relayTags = tags.filter((tag) => tag[0] === "r");

  const readRelays = relayTags.filter((tag) => tag[2] === "read" || !tag[2]).map((tag) => tag[1]);

  const writeRelays = relayTags.filter((tag) => tag[2] === "write" || !tag[2]).map((tag) => tag[1]);

  const flatRelays = relayTags.map((tag) => ({
    relay: tag[1],
    read: tag[2] === "read" || !tag[2],
    write: tag[2] === "write" || !tag[2],
  }));

  return { readRelays, writeRelays, flatRelays };
}

const cache = getCache();

export async function fetchNip65Relays(
  pubkey: string,
  sendOnce: boolean,
  onUpdate: (relays: Nip65Relays | null) => void,
) {
  const cachedNip65Event = cache.getNip65Event(pubkey);

  // send it even if it's null
  if (cachedNip65Event) {
    onUpdate(toReadWriteRelays(cachedNip65Event.tags));

    if (sendOnce) {
      return;
    }
  }

  const nip65Event = await pool.get(PROFILE_RELAYS, {
    kinds: [10002],
    authors: [pubkey],
    limit: 1,
  });

  if (!nip65Event) {
    // it is still null
    onUpdate(null);

    return;
  }

  if (cachedNip65Event?.id === nip65Event.id) {
    // nothing to update
    return;
  }

  // Relay is not important here
  cache.setNip65Event(pubkey, { ...nip65Event, relay: PROFILE_RELAYS[0] });

  const result = toReadWriteRelays(nip65Event.tags);

  onUpdate(result);
}

// this function is for server side rendering
export async function fetchNip65RelaysForProfiles(
  relays: string[],
  profilePubkeys: string[],
): Promise<Map<string, Nip65Relays>> {
  // fetch the latest event for each profile
  const events = await pool.querySync(relays, {
    kinds: [10002],
    authors: profilePubkeys,
    limit: 1,
  });

  const nip65Map = new Map<string, Nip65Relays>();

  events.forEach((event) => {
    const pubkey = profilePubkeys.find((p) => p === event.pubkey);

    if (!pubkey) {
      return;
    }

    nip65Map.set(pubkey, toReadWriteRelays(event.tags));
  });

  return nip65Map;
}
