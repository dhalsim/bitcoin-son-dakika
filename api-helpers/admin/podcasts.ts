import { finalizeEvent } from "nostr-tools/pure";
import { hexToBytes } from "nostr-tools/utils";

import { publishToRelays } from "../../src/lib/utils.js";
import type { AuthResult } from "../types.js";
import type { PodcastTag } from "../utils.js";
import { ADMIN_RELAYS, ErrorResponse, PublishEventResponse, createTitleSlug } from "../utils.js";

import type { AddPodcastResolvedPayload, PublishPodcastPayload } from "./types.js";

export async function handlePublishPodcast(
  masterAdminPrivateKey: string,
  podcastTags: PodcastTag[],
  authResult: AuthResult,
  data: PublishPodcastPayload,
): Promise<Response> {
  if (!authResult.success) {
    return ErrorResponse("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse("Only editors can publish podcasts", 403);
  }

  return await publishPodcast(masterAdminPrivateKey, podcastTags, authResult.pubkey, data);
}

async function publishPodcast(
  masterAdminPrivateKey: string,
  podcastTags: PodcastTag[],
  pubkey: string,
  data: PublishPodcastPayload,
): Promise<Response> {
  try {
    const { title, content, summary, image, audioUrl, duration, episodeNumber, tags } = data;

    if (!title || !content || !audioUrl) {
      return ErrorResponse("Title, content, and audioUrl are required", 400);
    }

    const privateKeyBytes = hexToBytes(masterAdminPrivateKey);

    // Create the podcast event
    const dIdentifier = createTitleSlug(title);
    const url = `https://bitcoinsondakika.com/podcast/${dIdentifier}`;

    const event = {
      kind: 30023,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["d", dIdentifier],
        ["r", url],
        // Add proxy tag for RSS protocol bridging
        [
          "proxy",
          `https://bitcoinsondakika.com/feed/podcast-rss.xml#${encodeURIComponent(url)}`,
          "rss",
        ],
        ["i", `podcast:item:guid:${url}`],
        ["editor", pubkey],
        ["title", title],
        ["content", content],
        ["audio", audioUrl],
        ...(summary ? [["summary", summary]] : []),
        ...(image ? [["image", image]] : []),
        ...(duration ? [["duration", duration]] : []),
        ...(episodeNumber ? [["episode", episodeNumber.toString()]] : []),
        ...tags.map((tag: string) => ["t", tag]),
      ],
      content,
    };

    // Sign the event
    const signedEvent = finalizeEvent(event, privateKeyBytes);

    // Publish to relays
    const result = await publishToRelays(signedEvent, ADMIN_RELAYS);

    const relay = result.find((r) => r.success)?.relay;

    if (!relay) {
      return ErrorResponse("Failed to publish article", 500);
    }

    // add podcast to curated set
    const addResult = await addPodcast(masterAdminPrivateKey, podcastTags, {
      action: "add-podcast",
      aTag: `30023:${signedEvent.pubkey}:${dIdentifier}`,
      relayTag: relay,
    });

    if (Array.isArray(addResult) ? addResult.some((r) => r.success) : true) {
      return PublishEventResponse(
        { message: "Podcast published successfully", result },
        { eventId: signedEvent.id, relay, addPodcastResult: addResult },
      );
    }

    return ErrorResponse("Failed to publish podcast", 500);
  } catch (error) {
    return ErrorResponse(error);
  }
}

async function addPodcast(
  masterPrivateKey: string,
  currentPodcasts: PodcastTag[],
  data: AddPodcastResolvedPayload,
) {
  try {
    const { aTag, relayTag } = data;

    if (!aTag || !relayTag) {
      return ErrorResponse("aTag and relayTag are required", 400);
    }

    const privateKeyBytes = hexToBytes(masterPrivateKey);

    const event = {
      kind: 30004,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["d", "podcasts"],
        ...currentPodcasts.map((tag) => ["a", tag.aTag, tag.relay]),
        ["a", aTag, relayTag],
      ],
      content: "Updated podcasts set",
    };

    const signedEvent = finalizeEvent(event, privateKeyBytes);

    const result = await publishToRelays(signedEvent, ADMIN_RELAYS);

    if (result.some((r) => r.success)) {
      return PublishEventResponse({ message: "Podcast added successfully", result }, data);
    }

    const failedRelays = result
      .filter((r) => !r.success)
      .map((r) => r.relay)
      .join(", ");

    return ErrorResponse(`Failed to add podcast to relays: ${failedRelays}`, 500);
  } catch (error) {
    return ErrorResponse(error);
  }
}

export async function handleRemovePodcast(
  masterAdminPrivateKey: string,
  podcastTags: any[],
  authResult: AuthResult,
  data: any,
): Promise<Response> {
  try {
    const { aTag, relay } = data;

    if (!aTag || !relay) {
      return ErrorResponse("aTag and relay are required", 400);
    }

    const privateKeyBytes = hexToBytes(masterAdminPrivateKey);

    // Remove the podcast from the set
    const updatedPodcastTags = podcastTags.filter((tag) => tag.aTag !== aTag);

    // Create the updated set event
    const setEvent = {
      kind: 30004,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", "podcasts"], ...updatedPodcastTags.map((tag) => ["a", tag.aTag, tag.relay])],
      content: "",
    };

    const signedSetEvent = finalizeEvent(setEvent, privateKeyBytes);

    const result = await publishToRelays(signedSetEvent, ADMIN_RELAYS);

    if (result.some((r) => r.success)) {
      return PublishEventResponse({ message: "Podcast removed successfully", result }, data);
    }

    const failedRelays = result
      .filter((r) => !r.success)
      .map((r) => r.relay)
      .join(", ");

    return ErrorResponse(`Failed to remove podcast from relays: ${failedRelays}`, 500);
  } catch (error) {
    return ErrorResponse(error);
  }
}
