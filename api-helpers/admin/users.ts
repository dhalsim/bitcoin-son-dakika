import { hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent } from "nostr-tools";

import { publishToRelays } from "../../src/lib/utils.js";
import type { AuthResult } from "../types.js";
import { ADMIN_RELAYS, ErrorResponse, PublishEventResponse } from "../utils.js";

import type { AdminActionData } from "./types.js";

export async function handleAddEditor(
  masterAdminPrivateKey: string,
  editorUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  if (!authResult.success) {
    return ErrorResponse("Authentication failed", 401);
  }

  if (!authResult.roles.includes("admin")) {
    return ErrorResponse("Only admins can add editors", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse("Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "editor-users",
    editorUsers,
    pubkey,
    "add",
  );
}

export async function handleRemoveEditor(
  masterAdminPrivateKey: string,
  editorUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  if (!authResult.success) {
    return ErrorResponse("Authentication failed", 401);
  }

  if (!authResult.roles.includes("admin")) {
    return ErrorResponse("Only admins can remove editors", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse("Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "editor-users",
    editorUsers,
    pubkey,
    "remove",
  );
}

export async function handleAddAdmin(
  masterAdminPrivateKey: string,
  currentAdminUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  if (!authResult.success) {
    return ErrorResponse("Authentication failed", 401);
  }

  if (!authResult.roles.includes("admin")) {
    return ErrorResponse("Only admins can add other admins", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse("Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "admin-users",
    currentAdminUsers,
    pubkey,
    "add",
  );
}

export async function handleRemoveAdmin(
  masterAdminPrivateKey: string,
  currentAdminUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  if (!authResult.success) {
    return ErrorResponse("Authentication failed", 401);
  }

  if (!authResult.roles.includes("admin")) {
    return ErrorResponse("Only admins can remove other admins", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse("Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "admin-users",
    currentAdminUsers,
    pubkey,
    "remove",
  );
}

export async function updateNostrUserSet(
  masterPrivateKey: string,
  setType: "admin-users" | "editor-users",
  currentUsers: string[],
  pubkey: string,
  operation: "add" | "remove",
): Promise<Response> {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    const existingUser = currentUsers.find((u) => u === pubkey);
    if (operation === "add") {
      if (existingUser) {
        return ErrorResponse("User already exists", 409);
      }
    } else {
      if (!existingUser) {
        return ErrorResponse("User not found", 404);
      }
    }

    const updatedUserTags =
      operation === "add"
        ? [...currentUsers.map((u) => ["p", u]), ["p", pubkey]]
        : currentUsers.filter((u) => u !== pubkey).map((u) => ["p", u]);

    const eventTemplate = {
      kind: 30000,
      created_at: currentTime,
      tags: [["d", setType], ...updatedUserTags],
      content: "",
    };
    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse(
      { message: `${operation === "add" ? "Added" : "Removed"} ${pubkey} from ${setType}`, result },
      { pubkey, setType, operation },
    );
  } catch (error) {
    return ErrorResponse(error || "Failed to update Nostr user set");
  }
}
