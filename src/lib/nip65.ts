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
  onUpdate: (relays: Nip65Relays) => void,
) {
  const cachedFromStorage = cache.getNip65(pubkey);

  if (cachedFromStorage) {
    onUpdate(cachedFromStorage);
  }

  const nip65Event = await pool.get(relays, {
    kinds: [10002],
    authors: [pubkey],
    limit: 1,
  });

  if (!nip65Event) {
    const emptyResult = {
      readRelays: [],
      writeRelays: [],
      flatRelays: [],
    };

    // Cache empty result to avoid repeated fetches
    cache.setNip65(pubkey, emptyResult);

    onUpdate(emptyResult);

    return;
  }

  const result = toReadWriteRelays(nip65Event.tags);

  cache.setNip65(pubkey, result);

  onUpdate(result);
}
