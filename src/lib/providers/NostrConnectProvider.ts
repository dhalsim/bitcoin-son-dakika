import { finalizeEvent, nip04, nip44, Relay } from "nostr-tools";
import { getConversationKey } from "nostr-tools/nip44";
import { bytesToHex, hexToBytes } from "nostr-tools/utils";

import type {
  NostrProvider,
  NostrProviderMethod,
  ProviderCapability,
  SignEventParams,
  SignEventResult,
} from "@/contexts/NostrAuthContext";

import { assertUnreachable, createKeyPair, generateRandomHexString } from "../utils";

export type NostrConnectData = {
  relay: string;
  uri: string;
  ephemeralSecret: string;
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
    const ephemeralSecret = hexToBytes(this.data.ephemeralSecret);

    let encryptedContent: string;

    try {
      const conversationKey = getConversationKey(ephemeralSecret, this.data.remoteSignerPubkey);

      encryptedContent = nip44.encrypt(
        JSON.stringify({
          id,
          method: "sign_event",
          params: [JSON.stringify(params.event)],
        }),
        conversationKey,
      );
    } catch (error) {
      console.error("Failed to encrypt content:", error);

      throw error;
    }

    const eventTemplateForSigning = {
      kind: 24133,
      pubkey: this.data.ephemeralPubkey,
      content: encryptedContent,
      tags: [["p", this.data.remoteSignerPubkey]], // p-tags the remote-signer-pubkey
      created_at: Math.floor(Date.now() / 1000),
    };

    const signedEvent = finalizeEvent(eventTemplateForSigning, ephemeralSecret);

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
            if (event.kind === 24133 && event.pubkey === this.data.remoteSignerPubkey) {
              const decrypted = decryptContent(event.content, event.pubkey, ephemeralSecret);

              if (!decrypted) {
                reject(new Error("Failed to decrypt content"));

                sub.close();
              }

              let parsed: { id: string; result: string; error: string };

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

  hasCapability(cap: ProviderCapability): boolean {
    switch (cap) {
      case "signEvent":
        // TODO: Implement when signing is implemented
        return true;
      case "getRelays":
        return false;
      case "getPublicKey":
        return true;
      default:
        assertUnreachable(cap);
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

const generateRandomSecret = () => {
  // Generate a short random string for the secret (8-12 characters)
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};

export function generateNostrConnectUri(relay: string): {
  uri: string;
  ephemeralData: NostrConnectData;
} {
  const keyPair = createKeyPair();

  // Generate a random secret for connection spoofing protection
  const connectionSecret = generateRandomSecret();

  // Build the URI according to NIP-46 specification
  const params = new URLSearchParams({
    relay: relay,
    secret: connectionSecret,
    perms: "sign_event,get_public_key",
    name: "bitcoinsondakika.com",
    url: window.location.origin,
  });

  const uri = `nostrconnect://${keyPair.pubkey}?${params.toString()}`;

  // Store the key pair with connection secret for later validation
  const ephemeralData: NostrConnectData = {
    relay: relay,
    uri: uri,
    ephemeralSecret: bytesToHex(keyPair.secret),
    ephemeralPubkey: keyPair.pubkey,
    timestamp: Math.floor(Date.now() / 1000),
    connectionSecret: connectionSecret,
    remoteSignerPubkey: null,
  };

  return { uri, ephemeralData };
}

export function decryptContent(
  content: string,
  pubkey: string,
  ephemeralSecretBytes: Uint8Array,
): string | null {
  try {
    let decryptedContent: string;

    if (content.includes("?iv=")) {
      decryptedContent = nip04.decrypt(ephemeralSecretBytes, pubkey, content);
    } else {
      const conversationKey = getConversationKey(ephemeralSecretBytes, pubkey);

      decryptedContent = nip44.decrypt(content, conversationKey);
    }

    return decryptedContent;
  } catch (error) {
    console.error("Failed to decrypt content:", error);

    return null;
  }
}
