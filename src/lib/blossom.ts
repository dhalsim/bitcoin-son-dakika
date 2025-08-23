// import { getCache } from "./cache";
// import { pool } from "./utils";

// export const defaultServers = [
//   "https://nostr.build/",
//   "https://nostrcheck.me/",
//   "https://satellite.earth/",
//   "https://files.v0l.io/",
//   "https://blossom.primal.net/",
// ];

// type GetUserBlossomServersParams = {
//   relays: string[];
//   pubkey: string;
//   sendOnce: boolean;
//   onUpdate: (servers: string[]) => void;
// };

// const cache = getCache();

// export async function getUserBlossomServers({
//   relays,
//   pubkey,
//   sendOnce,
//   onUpdate,
// }: GetUserBlossomServersParams) {
//   const cachedBlossomServers = cache.getBlossomServers(pubkey);

//   const userBlossomServersEvent = await pool.get(relays, {
//     kinds: [10063],
//     authors: [pubkey],
//     limit: 1,
//   });

//   if (!userBlossomServersEvent) {
//     return [];
//   }

//   const blossomServers = userBlossomServersEvent.tags.find((tag) => tag[0] === "server");

//   return blossomServers;
// }
