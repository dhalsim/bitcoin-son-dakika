import { finalizeEvent, nip04, Relay } from "nostr-tools";

import type {
  NostrProvider,
  NostrProviderMethod,
  SignEventParams,
  SignEventResult,
} from "@/contexts/NostrAuthContext";

import { generateRandomHexString } from "../utils";

export type NostrConnectData = {
  relay: string;
  uri: string;
  ephemeralSecret: Uint8Array;
  ephemeralPubkey: string;
  timestamp: number;
  connectionSecret: string;
  remoteSignerPubkey: string | null;
};

export class NostrConnectProvider implements NostrProvider {
  method: NostrProviderMethod;

  private data: NostrConnectData;

  constructor(data: NostrConnectData) {
    this.method = "nostrconnect";
    this.data = data;
  }

  async isReady(): Promise<boolean> {
    return true;
  }

  async getPublicKey(): Promise<string> {
    return this.data.remoteSignerPubkey;
  }

  async signEvent(params: SignEventParams): Promise<SignEventResult> {
    const id = generateRandomHexString(16);
    const encryptedContent = nip04.encrypt(
      this.data.ephemeralSecret,
      this.data.remoteSignerPubkey,
      JSON.stringify({
        id,
        method: "sign_event",
        params: [JSON.stringify(params.event)],
      }),
    );

    const eventTemplateForSigning = {
      kind: 24133,
      pubkey: this.data.ephemeralPubkey,
      content: encryptedContent,
      tags: [["p", this.data.remoteSignerPubkey]], // p-tags the remote-signer-pubkey
      created_at: Math.floor(Date.now() / 1000),
    };

    const signedEvent = finalizeEvent(eventTemplateForSigning, this.data.ephemeralSecret);

    const r = new Relay(this.data.relay);

    await r.connect();
    await r.publish(signedEvent);

    return new Promise((resolve, reject) => {
      const sub = r.subscribe(
        [
          {
            kinds: [24133],
            authors: [this.data.remoteSignerPubkey],
            "#p": [this.data.ephemeralPubkey],
            limit: 1,
          },
        ],
        {
          onevent: async (event) => {
            if (event.kind === 24133 && event.pubkey === this.data.ephemeralPubkey) {
              const decrypted = await nip04.decrypt(
                this.data.ephemeralSecret,
                this.data.remoteSignerPubkey,
                event.content,
              );

              let parsed;

              try {
                parsed = JSON.parse(decrypted);
              } catch (e) {
                reject(e);

                sub.close();

                return;
              }

              if (parsed.id !== id) {
                // this is not the event we are looking for
                return;
              }

              if (parsed.error) {
                sub.close();

                return reject(new Error(parsed.error));
              }

              try {
                sub.close();

                resolve({ signedEvent: JSON.parse(parsed.result), provider: this });
              } catch (e) {
                sub.close();

                reject(e);
              }
            }
          },
        },
      );
    });
  }

  hasCapability(cap: "getRelays" | "signEvent"): boolean {
    switch (cap) {
      case "signEvent":
        // TODO: Implement when signing is implemented
        return true;
      case "getRelays":
        return false;
      default:
        return false;
    }
  }

  dispose(): void {}
}

/**
 * Create a new NostrConnect provider instance
 */
export function createNostrConnectProvider(data: NostrConnectData): NostrConnectProvider {
  return new NostrConnectProvider(data);
}
