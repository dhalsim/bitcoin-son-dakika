import type { EventItem } from "./nip01";
import { logCloseReasons, pool } from "./utils";

export function getKind30023Events(
  relays: string[],
  pubkeys: string[],
  identifiers: string[],
  onUpdate: (events: Map<string, EventItem>) => void,
) {
  const newEvents = new Map<string, EventItem>();
  const receivedEventRelayMap = new Map<string, string>();

  let eoseCalled = false;

  const sub = pool.subscribe(
    relays,
    {
      authors: pubkeys,
      "#d": identifiers,
      kinds: [30023],
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
