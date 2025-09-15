import { nip19 } from "nostr-tools";

import type { GetPublicKey, SignEvent } from "@/contexts/NostrAuthContext";

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

export async function createNIP98Auth(
  method: string,
  url: string,
  getPublicKey: GetPublicKey,
  signEvent: SignEvent,
): Promise<string> {
  const pubkey = await getPublicKey({ options: { reason: "Admin panel işlemleri" } });

  if (!pubkey) {
    throw new Error("Giriş yapmanız gerekiyor");
  }

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

  const { signedEvent } = await signEvent({ event: authEvent });

  return `Nostr ${btoa(JSON.stringify(signedEvent))}`;
}

export async function postAdminAction(
  data: any,
  getPublicKey: GetPublicKey,
  signEvent: SignEvent,
): Promise<any> {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/api/admin-panel`;
  const auth = await createNIP98Auth("POST", url, getPublicKey, signEvent);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: auth },
    body: JSON.stringify(data),
  });

  return res.json();
}

export type PublishToXParams = {
  blob: Blob;
  firstPost: string;
  secondPost: string;
  type: "news" | "podcast" | "article";
  slug: string;
  getPublicKey: GetPublicKey;
  signEvent: SignEvent;
};

export async function publishToX({
  blob,
  firstPost,
  secondPost,
  type,
  slug,
  getPublicKey,
  signEvent,
}: PublishToXParams): Promise<Response> {
  const form = new FormData();
  form.append("action", "upload-to-x");
  form.append("firstPost", firstPost);
  form.append("secondPost", secondPost);
  form.append("type", type);
  form.append("slug", slug);
  form.append("media", new File([blob], "post.png", { type: "image/png" }));

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/api/admin-panel`;
  const auth = await createNIP98Auth("POST", url, getPublicKey, signEvent);

  return fetch(url, {
    method: "POST",
    headers: {
      // Do NOT set Content-Type here; the browser will set the proper multipart boundary
      Authorization: auth,
    },
    body: form,
  });
}
