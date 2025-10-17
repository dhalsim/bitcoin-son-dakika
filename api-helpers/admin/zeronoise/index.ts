import type { RedisClient } from "../../common.js";
import { ErrorResponseCreator, SuccessResponse } from "../../common_with_client.js";
import type { AuthResult } from "../../types.js";

import { formatNewsItem } from "./ai-formatter.js";
import { fetchFromBlob } from "./blob.js";
import { shouldFetchFresh, getCachedEmails, cacheEmails } from "./cache.js";
import { fetchFromGmail } from "./gmail.js";
import { parseEmailMarkdown } from "./parser.js";
import type { ZeronoiseEmail, ZeronoiseNewsItem } from "./types.js";

export async function handleFetchZeronoiseEmails(
  redis: RedisClient,
  authResult: AuthResult,
  noCache: boolean = false,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can fetch emails", 403);
  }

  try {
    // Check cache
    if (!(await shouldFetchFresh(redis, noCache))) {
      const cached = await getCachedEmails(redis);

      if (cached) {
        // Parse cached emails and return with items
        const emailsWithItems = await Promise.all(
          cached.map(async (email) => {
            try {
              const markdown = await fetchBlobContent(email.blobUrl);
              const items = parseEmailMarkdown(markdown);

              return { ...email, items };
            } catch (error) {
              console.error(`Error parsing cached email ${email.messageId}:`, error);

              return { ...email, items: [] };
            }
          }),
        );

        return SuccessResponse({ emails: emailsWithItems, fromCache: true });
      }
    }

    // Fetch fresh from Gmail
    const emailsFromGmail = await fetchFromGmail();

    // Fetch from blob storage for old emails
    const emailsFromBlobStorage = await fetchFromBlob();

    // Deduplicate emails by messageId
    const emailMap = new Map<string, ZeronoiseEmail>();

    // Add Gmail emails first (they take priority as they're fresh)
    emailsFromGmail.forEach((email) => {
      emailMap.set(email.messageId, email);
    });

    // Add blob emails only if they don't exist in Gmail
    emailsFromBlobStorage.forEach((email) => {
      if (!emailMap.has(email.messageId)) {
        emailMap.set(email.messageId, email);
      }
    });

    const emails = Array.from(emailMap.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Cache results
    await cacheEmails(redis, emails);

    // Parse all emails and return with parsed items
    const emailsWithItems = await Promise.all(
      emails.map(async (email) => {
        try {
          const markdown = await fetchBlobContent(email.blobUrl);
          const items = parseEmailMarkdown(markdown);

          return { ...email, items };
        } catch (error) {
          console.error(`Error parsing email ${email.messageId}:`, error);

          return { ...email, items: [] };
        }
      }),
    );

    return SuccessResponse({ emails: emailsWithItems, fromCache: false });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to fetch Zeronoise emails");
    console.error("Error in handleFetchZeronoiseEmails:", err);

    return ErrorResponseCreator(err.message, 500);
  }
}

export async function handleFormatZeronoiseItem(
  redis: RedisClient,
  authResult: AuthResult,
  requestBody: { messageId: string; itemIndex: number; item: ZeronoiseNewsItem },
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can format items", 403);
  }

  try {
    const formatted = await formatNewsItem(redis, requestBody.item, requestBody.messageId);

    return SuccessResponse({ formatted });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to format Zeronoise item");
    console.error("Error in handleFormatZeronoiseItem:", err);

    return ErrorResponseCreator(err.message, 500);
  }
}

async function fetchBlobContent(blobUrl: string): Promise<string> {
  try {
    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob content: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.error(`Error fetching blob content from ${blobUrl}:`, error);

    throw error;
  }
}
