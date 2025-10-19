/*
  Local test script: Connect to Gmail via Gmail API and search for
  unread messages from no-reply@zeronoise.ai with subject starting with
  "Bitcoin Intelligence Tracker". Prints a summary of matches.

  Env in .env.local:
    GMAIL_ACCESS_TOKEN=short_lived_access_token

  Usage:
    npm i googleapis dotenv
    node scripts/test-gmail-api.cjs
*/

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
const { google } = require("googleapis");
const TurndownService = require("turndown");

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

// Remove blockquote formatting (often from forwarded emails)
turndownService.addRule("removeBlockquotes", {
  filter: "blockquote",
  replacement: function (content) {
    return content; // Just return the content without blockquote markers
  },
});

const GMAIL_ACCESS_TOKEN = process.env.GMAIL_ACCESS_TOKEN;

if (!GMAIL_ACCESS_TOKEN) {
  console.error("Missing GMAIL_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

//const SENDER = "no-reply@zeronoise.ai";
const SUBJECT_PREFIX = "Bitcoin Intelligence Tracker:";

(async () => {
  try {
    console.log("Connecting to Gmail API...");

    // Create OAuth2 client with access token
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: GMAIL_ACCESS_TOKEN });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Search for unread messages from sender with subject prefix
    //const query = `from:${SENDER} subject:"${SUBJECT_PREFIX}" is:unread`;
    const query = `subject:"${SUBJECT_PREFIX}"`;
    console.log(`Searching with query: ${query}`);

    const listResponse = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: 100,
    });

    const messages = listResponse.data.messages || [];
    console.log(`Found ${messages.length} matching message(s).\n`);

    if (messages.length === 0) {
      return;
    }

    // Fetch details for each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const details = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full", // "full" gives parsed structure, "raw" gives base64 RFC822
      });

      const headers = details.data.payload.headers;
      const getHeader = (name) =>
        (headers.find((h) => h.name.toLowerCase() === name.toLowerCase()) || {}).value || "(none)";

      console.log(`- [${i + 1}] ID=${msg.id}`);
      console.log(`  From: ${getHeader("From")}`);
      console.log(`  Subject: ${getHeader("Subject")}`);
      console.log(`  Date: ${getHeader("Date")}`);
      console.log(`  Message-ID: ${getHeader("Message-ID")}`);

      // Get email body (HTML)
      const htmlBody = getEmailBody(details.data.payload);

      // Convert HTML to Markdown
      const markdown = htmlBody ? turndownService.turndown(htmlBody) : "(no body)";

      // Save to file
      const filename = path.join(
        process.cwd(),
        "scripts",
        "zeronoise-parsed-emails",
        `email-${msg.id}.md`,
      );

      fs.writeFileSync(filename, markdown);

      console.log(`  HTML length: ${htmlBody.length} chars`);
      console.log(`  Markdown length: ${markdown.length} chars`);
      console.log(`  Saved to: ${filename}`);
      console.log(`  Preview: ${markdown.substring(0, 200)}...`);
      console.log();
    }

    // Helper function to extract email body
    function getEmailBody(payload) {
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
            if (body) break;
          }
        }
      }

      return body || "(no body)";
    }

    console.log("✓ Test completed successfully");
  } catch (err) {
    console.error("Gmail API test failed:");
    console.error(err.message);
    if (err.code === 401) {
      console.error("\nToken expired or invalid. Run: node scripts/refresh-gmail-token.cjs");
    }
    process.exit(1);
  }
})();
