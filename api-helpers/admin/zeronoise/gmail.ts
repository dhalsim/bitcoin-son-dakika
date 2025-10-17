import { google } from "googleapis";
import TurndownService from "turndown";

import { getRedis } from "../../common.js";

import { storeEmailInBlob } from "./blob.js";
import {
  getCachedGmailAccessToken,
  cacheGmailAccessToken,
  refreshGmailAccessToken,
} from "./cache.js";
import type { ZeronoiseEmail } from "./types.js";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

const SUBJECT_PREFIX = "Bitcoin Intelligence Tracker:";

async function getGmailAccessToken(): Promise<string> {
  const redis = await getRedis();

  // Try to get cached token first
  let accessToken = await getCachedGmailAccessToken(redis);

  if (!accessToken) {
    console.log("No cached access token found, refreshing...");

    accessToken = await refreshGmailAccessToken();

    await cacheGmailAccessToken(redis, accessToken);

    console.log("Access token refreshed and cached");
  } else {
    console.log("Using cached access token");
  }

  return accessToken;
}

export async function fetchFromGmail(): Promise<ZeronoiseEmail[]> {
  console.log("Connecting to Gmail API...");

  // Get access token (from cache or refresh)
  const accessToken = await getGmailAccessToken();

  // Create OAuth2 client with access token
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Search for unread messages with subject prefix
  const query = `subject:"${SUBJECT_PREFIX}" is:unread`;
  console.log(`Searching with query: ${query}`);

  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 100,
  });

  const messages = listResponse.data.messages || [];
  console.log(`Found ${messages.length} matching message(s).`);

  if (messages.length === 0) {
    return [];
  }

  const emails: ZeronoiseEmail[] = [];

  // Fetch details for each message
  for (const msg of messages) {
    try {
      const details = await gmail.users.messages.get({
        userId: "me",
        id: msg.id!,
        format: "full", // "full" gives parsed structure, "raw" gives base64 RFC822
      });

      const headers = details.data.payload?.headers || [];

      const getHeader = (name: string) =>
        (headers.find((h) => h.name?.toLowerCase() === name.toLowerCase()) || {}).value || "(none)";

      const messageId = getHeader("Message-ID");
      const subject = getHeader("Subject");
      const date = getHeader("Date");

      console.log(`Processing email: ${subject}`);

      // Get email body (HTML)
      const htmlBody = getEmailBody(details.data.payload!);

      // Convert HTML to Markdown
      const markdown = htmlBody ? turndownService.turndown(htmlBody) : "(no body)";

      // Store in Vercel Blob
      const blobUrl = await storeEmailInBlob(messageId, markdown);

      emails.push({
        messageId: messageId,
        subject: subject,
        date: new Date(date).toISOString(),
        blobUrl: blobUrl,
      });

      // Mark email as read to prevent re-processing
      await gmail.users.messages.modify({
        userId: "me",
        id: msg.id!,
        requestBody: {
          removeLabelIds: ["UNREAD"],
        },
      });

      console.log(`Stored email ${messageId} to blob: ${blobUrl}`);
    } catch (error) {
      console.error(`Error processing message ${msg.id}:`, error);
      // Continue with other messages
    }
  }

  return emails;
}

// Helper function to extract email body
function getEmailBody(payload: any): string {
  let body = "";

  // Check if payload has body data directly
  if (payload.body && payload.body.data) {
    body = Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  // Otherwise check parts (multipart messages)
  else if (payload.parts) {
    for (const part of payload.parts) {
      // Prefer text/html, fallback to text/plain
      if (part.mimeType === "text/html" && part.body && part.body.data) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
        break;
      } else if (part.mimeType === "text/plain" && part.body && part.body.data && !body) {
        body = Buffer.from(part.body.data, "base64").toString("utf-8");
      }
      // Recursively check nested parts
      else if (part.parts) {
        body = getEmailBody(part);
        if (body) {
          break;
        }
      }
    }
  }

  return body || "(no body)";
}
