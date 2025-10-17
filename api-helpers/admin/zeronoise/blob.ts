import { put, list } from "@vercel/blob";

import type { ZeronoiseEmail } from "./types.js";

export async function storeEmailInBlob(messageId: string, markdown: string): Promise<string> {
  const filename = `zeronoise/emails/${messageId}.md`;

  const blob = await put(filename, markdown, {
    access: "public",
    contentType: "text/markdown",
  });

  return blob.url;
}

export async function fetchFromBlob(): Promise<ZeronoiseEmail[]> {
  try {
    const files = await list({ prefix: "zeronoise/emails" });

    const emails: ZeronoiseEmail[] = [];

    for (const file of files.blobs) {
      try {
        // Extract messageId from filename: zeronoise/emails/{messageId}.md
        const messageId = file.pathname.split("/")[2]?.split(".")[0] || "unknown";

        // Fetch the content to extract subject
        const response = await fetch(file.url);
        if (response.ok) {
          const content = await response.text();
          // Try to extract subject from content (look for "Subject:" or similar patterns)
          const subjectMatch =
            content.match(/Subject:\s*(.+)/i) ||
            content.match(/^#\s*(.+)/m) ||
            content.match(/Bitcoin Intelligence Tracker[:\s]*(.+)/i);

          const subject = subjectMatch
            ? subjectMatch[1].trim()
            : `Bitcoin Intelligence Tracker: ${messageId}`;

          emails.push({
            messageId,
            subject,
            date: file.uploadedAt.toISOString(),
            blobUrl: file.url,
          });
        }
      } catch (error) {
        console.error(`Error processing blob file ${file.pathname}:`, error);
        // Continue with other files
      }
    }

    return emails;
  } catch (error) {
    console.error("Error fetching from blob storage:", error);

    return [];
  }
}
