import { getCache } from "./cache";
import { pool } from "./utils";

export type Nip65Relays = {
  readRelays: string[];
  writeRelays: string[];
  flatRelays: { relay: string; read: boolean; write: boolean }[];
};

function toReadWriteRelays(tags: string[][]): Nip65Relays {
  const relayTags = tags.filter((tag) => tag[0] === "r");

  const readRelays = relayTags
    .filter((tag) => tag[2] === "read" || !tag[2])
    .map((tag) => tag[1]);

  const writeRelays = relayTags
    .filter((tag) => tag[2] === "write" || !tag[2])
    .map((tag) => tag[1]);

  const flatRelays = relayTags.map((tag) => ({
    relay: tag[1],
    read: tag[2] === "read" || !tag[2],
    write: tag[2] === "write" || !tag[2],
  }));

  return { readRelays, writeRelays, flatRelays };
}

const cache = getCache();

export async function fetchNip65Relays(
  relays: string[],
  pubkey: string,
  onUpdate: (relays: Nip65Relays | null) => void,
) {
  const cachedNip65Event = cache.getNip65Event(pubkey);

  // send it even if it's null
  if (cachedNip65Event) {
    onUpdate(toReadWriteRelays(cachedNip65Event.tags));
  }

  const nip65Event = await pool.get(relays, {
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

  cache.setNip65Event(pubkey, nip65Event);

  const result = toReadWriteRelays(nip65Event.tags);

  onUpdate(result);
}
