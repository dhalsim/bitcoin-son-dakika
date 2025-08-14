declare global {
  interface Window {
    nostr?: {
      getPublicKey(): Promise<string>;
      signEvent(event: NostrEvent): Promise<NostrEvent>;
      getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
      nip04?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
      nip44?: {
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
      };
    };

    webln?: {
      isEnabled(): Promise<boolean>;
      enable(): Promise<void>;
      getInfo(): Promise<{
        enabled: boolean;
        supported: boolean;
        version?: string;
        supports?: string[];
        methods?: string[];
        node?: { alias?: string };
      }>;
      sendPayment(invoice: string): Promise<{
        preimage?: string;
        paymentHash?: string;
      }>;
    };
  }
}

export {};
