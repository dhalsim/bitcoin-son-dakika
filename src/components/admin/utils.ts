import { nip19 } from "nostr-tools";

export type NpubValidationResult =
  | { valid: true; pubkey: string }
  | { valid: false; error: string };

export const validateNpub = (npub: string): NpubValidationResult => {
  try {
    const decoded = nip19.decode(npub);
    if (decoded.type !== "npub") {
      return { valid: false, error: "Adres npub formatında olmalıdır" };
    }

    return { valid: true, pubkey: decoded.data };
  } catch {
    return { valid: false, error: "Geçersiz npub" };
  }
};

export async function createNIP98Auth(method: string, url: string): Promise<string> {
  if (typeof window === "undefined" || !window.nostr) {
    throw new Error("Nostr uzantısı gerekli");
  }

  const pubkey = await window.nostr.getPublicKey();

  const authEvent = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ["u", url],
      ["method", method],
    ],
    content: "",
    pubkey,
  };

  const signedEvent = await window.nostr.signEvent(authEvent as any);

  return `Nostr ${btoa(JSON.stringify(signedEvent))}`;
}

export async function postAdminAction(data: any): Promise<any> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  const auth = await createNIP98Auth("POST", `${origin}/api/admin`);

  const res = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(data),
  });

  return res.json();
}
