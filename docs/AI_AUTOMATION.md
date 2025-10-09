## AI Automation — Design Doc (Initial Draft)

### Overview

"AI Automation" is a Vercel serverless workflow that ingests specific emails, processes them via an AI service (ppq.ai), validates the results with a second AI pass, and publishes final markdown reports to shared storage. It can be triggered by a cron job or an API call.

### Goals

- **Automate** parsing of incoming intelligence emails into structured markdown.
- **Enrich** using an AI model (with web-search capability) behind ppq.ai.
- **Validate** outputs via a satisfaction check loop until accepted.
- **Publish** results as markdown artifacts accessible to other workers.
- **Prevent duplicates** using Redis keys (subject-based de-duplication).

### Non-goals (for now)

- Building a UI or dashboard.
- Complex state machines or workflow engines.
- Long-running persistent connections; everything runs serverless.

### Triggers

- **Vercel Cron**: Scheduled execution via `vercel.json` crons.
- **API Call**: `POST /api/ai` to run on demand; optional query/body to override model and limits.

### High-level Workflow

There are two phases: a staged cron workflow (manual approval) and a generation workflow (runs after approval).

1. Staged Cron Workflow (manual approval)

1) **Read unread emails** from the configured account.
   - Filter: subject starts with `Bitcoin Intelligence Tracker` and sender is `no-reply@zeronoise.ai`.
   - Use Redis to check a subject-based key (or message-id) for de-duplication.
2) **Parse each email** into clean markdown (normalize quotes, strip signatures, convert HTML to MD).
3) **Write parsed content** to shared storage (Blob/S3) and record a reference URL.
4) **Extract candidate news items and score interest** via a lightweight AI prompt.
5) **Store staged items** in Redis with their scores and metadata for editor review.

2. Generation Workflow (on approval)

6) **Admin UI lists staged items** (fetched from Redis) via authenticated API.
7) **Editors select items to proceed**; API call approves them.
8) **For approved items**, run the previously defined search AI agent to generate the final report(s) using ppq.ai (web-search capable model) and validation loop.
9) **Publish final markdown** to storage and mark items as processed.

### Architecture & Layout

- Single worker entrypoint: `api/ai.ts` (Vercel Serverless Function)
- Helpers: `api-helpers/ai/`
  - `email.ts` — IMAP/Gmail fetch, filtering, de-duplication checks
  - `parser.ts` — email to markdown parsing
  - `ai.ts` — ppq.ai client (invoke model, pass system prompt, handle search-capable model param)
  - `validation.ts` — satisfaction checking loop logic
  - `storage.ts` — publish/read markdown via Vercel Blob or S3
  - `redis.ts` — de-duplication and transient state
  - `logger.ts` — structured logging/correlation ids

Data flow: email inbox → filter by sender/subject → Redis de-dupe → parse → ppq.ai generation → storage (markdown) → ppq.ai validation loop → finalize + Redis mark processed.

### Storage Strategy

- Constraint: Redis total ~30MB usable; do not store full reports in Redis.
- Recommended:
  - **Redis** (Upstash) for keys, locks, lightweight state: de-dupe, job ids, last run times.
  - **Vercel Blob** (or **S3**) for markdown reports and any large artifacts; returns public or signed URLs for downstream workers.
- Local dev: filesystem writes allowed for convenience; avoid relying on it in production (ephemeral on Vercel).

#### Redis Key Schema (proposed)

- Processed subject: `ai:email:processed:{sha256(subject)}` → value: timestamp; TTL optional (e.g., 180 days)
- Processed message id (optional/stronger): `ai:email:msgid:{sha256(messageId)}` → timestamp
- Global lock: `ai:lock` → short TTL to prevent overlapping runs
- Last run marker: `ai:last_run` → ISO timestamp
- Job state: `ai:job:{uuid}` → JSON snippet (small only)
- Staged items (for editor review):
  - Sorted set for ordering by interest score: `ai:staged:z` → member: `news:{id}`, score: float
  - Hash per item for metadata: `ai:staged:h:{id}` → fields: `subject`, `source`, `parsedUrl`, `excerpt`, `score`, `createdAt`
  - Optional set for grouping by date: `ai:staged:s:{yyyyMMdd}`

- Gmail OAuth tokens (simplified):
- `ai:gmail:access_token` → access token string
- `ai:gmail:expiry_date` → access token expiry time in Unix ms
- `ai:gmail:refresh_expires_at` → refresh token expiry time in Unix ms

Note on using a Redis Set: a plain Set can hold unique ids but cannot order by score. For scoring/ordering, a Sorted Set (ZSET) is preferred. We will use ZSET + HASH for details while keeping memory footprint small.

### Email Ingestion

- **Library**: Gmail API via `googleapis` (preferred over IMAP for Gmail; avoids XOAUTH2 auth issues)
- **Filter criteria**:
  - Query: `from:no-reply@zeronoise.ai subject:"Bitcoin Intelligence Tracker" is:unread`
  - No Redis deduplication needed; Gmail's `is:unread` filter handles it
- **Mark-as-read**: After successfully processing each email, mark it as read using `gmail.users.messages.modify()` to remove the `UNREAD` label. This prevents reprocessing on next run.
- **Advantages over IMAP**: REST API, no auth mechanism issues, better reliability, simpler code, native unread handling

Gmail OAuth2 Access Token Handling (simplified):

- Read `ai:gmail:access_token` and `ai:gmail:expiry_date` from Redis.
- If `now < expiry_date - 5min`, use the cached access token.
- Otherwise, read `ai:gmail:refresh_expires_at`.
  - If `now >= refresh_expires_at`, fail with a clear error indicating manual token renewal is required.
  - If `now < refresh_expires_at`, send a refresh request to `https://oauth2.googleapis.com/token` with `grant_type=refresh_token` and `GMAIL_REFRESH_TOKEN`.
    - On success, update:
      - `ai:gmail:access_token` to the new token
      - `ai:gmail:expiry_date` to `now + (expires_in * 1000)`
      - `ai:gmail:refresh_expires_at` to `now + (refresh_token_expires_in * 1000)` if present (else keep existing)
    - On error (e.g., `invalid_grant`), return the same manual renewal error.
- **Scope must be** `https://mail.google.com/` (full Gmail access) or `https://www.googleapis.com/auth/gmail.readonly` (read-only).
- If the refresh fails with `invalid_grant`, re-consent is required even if `refresh_expires_at` has not yet passed.
- **Note**: Gmail API must be enabled in Google Cloud Console for the OAuth client project.

Example Gmail API usage:

```js
const { google } = require("googleapis");
const oauth2Client = new google.auth.OAuth2();
oauth2Client.setCredentials({ access_token: gmailAccessToken });
const gmail = google.gmail({ version: "v1", auth: oauth2Client });

const listResponse = await gmail.users.messages.list({
  userId: "me",
  q: 'from:no-reply@zeronoise.ai subject:"Bitcoin Intelligence Tracker" is:unread',
  maxResults: 100,
});

for (const msg of listResponse.data.messages || []) {
  const details = await gmail.users.messages.get({
    userId: "me",
    id: msg.id,
    format: "full",
  });
  // Extract body from details.data.payload
}
```

### Parsing to Markdown

- Gmail API returns HTML body in base64-encoded format within `payload.parts` or `payload.body.data`.
- Decode base64 and convert HTML→Markdown using `turndown`.
- Sanitization: strip tracking pixels, normalize headings/lists, remove footers.

Example parsing with turndown:

```js
const TurndownService = require("turndown");
const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
});

function getEmailBody(payload) {
  let htmlBody = "";

  if (payload.body && payload.body.data) {
    htmlBody = Buffer.from(payload.body.data, "base64").toString("utf-8");
  } else if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body && part.body.data) {
        htmlBody = Buffer.from(part.body.data, "base64").toString("utf-8");
        break;
      } else if (part.parts) {
        htmlBody = getEmailBody(part); // recursive
        if (htmlBody) break;
      }
    }
  }

  return htmlBody ? turndownService.turndown(htmlBody) : "";
}
```

### Candidate Extraction & Scoring (Staging)

- After parsing, call a lightweight AI prompt to:
  - Extract discrete news items (titles + 1–2 sentence summaries)
  - Assign an interest score per item (0–1 or 0–100)
- Write each item to Redis:
  - `ZADD ai:staged:z <score> news:{id}`
  - `HSET ai:staged:h:{id} { subject, source, parsedUrl, excerpt, score, createdAt }`
- The `id` can be `sha256(messageId + normalizedTitle)` to remain stable and de-duplicate.

### AI Orchestration (ppq.ai)

- Endpoint via `AI_API_URL` with `AI_AUTH_KEY` authentication.
- Model must support web search; allow override via request: `model` (e.g., `PPQ_MODEL_ID`).
- Inputs:
  - `system` (specialized prompt, user-provided later)
  - `email_markdown`
  - Optional: previous report when iterating
- Outputs: primary markdown content plus any metadata (citations, links).

Example request body (placeholder):

```json
{
  "model": "ppq-search-pro",
  "messages": [
    { "role": "system", "content": "<SYSTEM_PROMPT>" },
    { "role": "user", "content": "<EMAIL_MARKDOWN>" }
  ],
  "tools": ["web_search"],
  "temperature": 0.2
}
```

### Validation Loop (Generation Phase)

- Secondary AI call evaluates satisfaction of the prompt with access to:
  - Latest report markdown
  - Original email markdown
- Expected boolean decision + optional reasons.
- If `false`, re-call generation with feedback and latest report appended.
- Guardrails: `MAX_ITERATIONS` (e.g., 3–5), incremental backoff, and cost tracking.

### Publishing Markdown Reports

- Preferred: **Vercel Blob** (`@vercel/blob`). Alternative: **S3** (`aws-sdk v3`).
- Filenames: `reports/{yyyy}/{MM}/{dd}/{subject-hash}-{timestamp}.md`
- Store minimal metadata (subject, sender, message-id, job id) alongside or in Redis.
- Return canonical URL for downstream workers (read-only access recommended).

### API Contracts

1. Cron/Staging — `POST /api/ai` (invoked by Vercel Cron or manual)

- Purpose: Read emails → parse → store parsed → extract/score → stage to Redis.
- Request options:
  - Query/body: `limit` (max emails per run), `dryRun` (boolean), `force` (bypass lock), `since` (ISO)
- Responses:
  - 200: `{ runId, staged: number, skipped: number, parsedArtifacts: [{subject, parsedUrl}] }`
  - 409: `{ error: "locked" }`

2. Admin Actions (single endpoint, dispatcher pattern) — `POST /api/ai-automation`

- Security: Requires `authenticateNIP98` (same pattern as `api/admin-panel.ts`).
- Request body shape: `{ action: string, ...payload }`
- Actions:
  - `list-staged`: returns the staged items (paged, sorted by score)
  - `approve-staged`: approves a list of ids for generation
  - `reject-staged`: removes a list of ids without generation
  - `clear-staged`: clears all staged items (admin-only)
  - `trigger-generation`: re-triggers generation for specific ids (idempotent)
  - `gmail-token-health`: returns token TTL, last success/error, fail_count
  - `gmail-refresh-token-now`: forces a refresh and returns result
- Example responses:
  - `list-staged` 200: `{ items: [{ id, subject, excerpt, score, parsedUrl, createdAt }], nextCursor }`
  - `approve-staged` 200: `{ approved: [id], queued: [jobId] }`
  - `trigger-generation` 200: `{ triggered: [id], jobs: [jobId] }`

3. Generation Results — already covered by the publishing step; downstream workers can consume the stored markdown URLs.

### Error Handling & Observability

- Structured logging (JSON) with `runId` and `jobId` correlation.
- Warn on validation loop exhaustion; include reasons.
- Metrics (counts, durations) via logs for now; upgrade later.
- Retries: idempotent fetch of emails; AI calls retried with jitter (respect provider rate limits).

### Security

- Store secrets in Vercel project env, not in code.
- Validate inputs: limit bounds; model allowlist.
- Outbound URLs allowlist for AI and storage providers.
- Avoid logging PII or full email bodies; hash subjects in logs.

### Local Development

- `.env.local` with required vars (see below).
- Run with `vercel dev` or `node`+`ts-node` depending on setup.
- Provide a `dryRun` mode that lists candidates without calling AI or writing files.

### Vercel Configuration

- `vercel.json` example (cron + function memory/time tweaks):

```json
{
  "crons": [{ "path": "/api/ai", "schedule": "*/30 * * * *" }],
  "functions": {
    "api/ai.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

### Dependencies (proposed)

- `@vercel/node` — types for Vercel handler
- `@vercel/blob` — blob storage client (if chosen)
- `@upstash/redis` (or `ioredis`) — Redis client
- `googleapis` — Gmail API client
- `turndown` — HTML → Markdown conversion
- `zod` — input/response validation (optional)
- `uuid` — run/job ids
- `node-fetch` or native `fetch` — HTTP calls (ppq.ai)
- `pino` — structured logging (optional)

### Directory Structure (target)

```
api/ai.ts                                 # Cron/Staging entrypoint
api/ai-automation.ts                      # Admin actions (dispatcher pattern)
api-helpers/ai/email.ts
api-helpers/ai/parser.ts
api-helpers/ai/ai.ts
api-helpers/ai/validation.ts
api-helpers/ai/storage.ts
api-helpers/ai/redis.ts
api-helpers/ai/logger.ts
api-helpers/ai/dispatcher.ts              # NIP-98 auth + action switch (list/approve/...)
api-helpers/ai/gmail_oauth.ts             # Gmail access token cache/refresh via Redis
```

### Pseudocode — `api/ai.ts` (Cron/Staging)

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withLock, stageItem } from "../api-helpers/ai/redis";
import { fetchUnreadEmails, markEmailAsRead } from "../api-helpers/ai/email";
import { parseEmailToMarkdown } from "../api-helpers/ai/parser";
import { publishMarkdown } from "../api-helpers/ai/storage";
import { extractAndScoreCandidates } from "../api-helpers/ai/ai";
import { getGmailAccessToken } from "../api-helpers/ai/gmail_oauth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { model, limit = 10, dryRun = false, force = false } = parseQuery(req);
  const runId = createRunId();
  const result = { runId, staged: 0, processed: 0, parsedArtifacts: [] as any[] } as any;

  await withLock(
    async () => {
      // Ensure we have a valid Gmail access token cached in Redis (refresh if needed)
      const gmailAccessToken = await getGmailAccessToken();

      const emails = await fetchUnreadEmails({ accessToken: gmailAccessToken, limit });
      for (const email of emails) {
        try {
          const md = await parseEmailToMarkdown(email.payload);
          if (dryRun) {
            continue;
          }
          const { url } = await publishMarkdown({ subject: email.subject, body: md });
          result.parsedArtifacts.push({ subject: email.subject, parsedUrl: url });
          const candidates = await extractAndScoreCandidates({ emailMarkdown: md, model });
          for (const c of candidates) {
            await stageItem(c); // writes to ZSET + HASH
            result.staged++;
          }
          // Mark as read after successful processing
          await markEmailAsRead({ accessToken: gmailAccessToken, messageId: email.id });
          result.processed++;
        } catch (err) {
          console.error(`Failed to process email ${email.id}:`, err);
          // Don't mark as read if processing failed
        }
      }
    },
    { force },
  );

  res.status(200).json(result);
}
```

### Pseudocode — `api-helpers/ai/gmail_oauth.ts`

```ts
import { redisGet, redisSet, redisMGet } from "./redis";

const ACCESS_TOKEN_KEY = "ai:gmail:access_token";
const EXPIRY_DATE_KEY = "ai:gmail:expiry_date"; // unix ms
const REFRESH_EXPIRES_AT_KEY = "ai:gmail:refresh_expires_at"; // unix ms

export async function getGmailAccessToken() {
  const [token, expiryMs] = await redisMGet(ACCESS_TOKEN_KEY, EXPIRY_DATE_KEY);
  const now = Date.now();
  const expiry = Number(expiryMs || 0);
  if (token && expiry && now < expiry - 5 * 60 * 1000) {
    return token;
  }
  return await refreshGmailAccessToken();
}

export async function refreshGmailAccessToken() {
  const refreshExpiryRaw = await redisGet(REFRESH_EXPIRES_AT_KEY);
  const refreshExpiry = Number(refreshExpiryRaw || 0);
  const now = Date.now();
  if (refreshExpiry && now >= refreshExpiry) {
    throw new Error("E_GMAIL_RECONSENT_REQUIRED: Refresh token expired; re-run consent.");
  }

  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
    grant_type: "refresh_token",
  });
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await resp.json();
  if (!resp.ok || !json.access_token) {
    throw new Error(`Failed to refresh Gmail access token: ${json.error || "unknown"}`);
  }
  const expiresIn = Number(json.expires_in || 3600);
  const newExpiry = Date.now() + expiresIn * 1000;
  await redisSet(ACCESS_TOKEN_KEY, json.access_token);
  await redisSet(EXPIRY_DATE_KEY, String(newExpiry));
  if (json.refresh_token_expires_in) {
    await redisSet(
      REFRESH_EXPIRES_AT_KEY,
      String(Date.now() + Number(json.refresh_token_expires_in) * 1000),
    );
  }
  return json.access_token;
}
```

### Pseudocode — `api/ai-automation.ts` (Dispatcher with NIP-98)

```ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { authenticateNIP98 } from "../api-helpers/common_with_client"; // mirror existing import pattern
import {
  listStaged,
  approveStaged,
  rejectStaged,
  clearStaged,
  triggerGeneration,
} from "../api-helpers/ai/dispatcher";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authHeader = (req.headers["authorization"] || "") as string;
    const authResult = await authenticateNIP98(
      authHeader,
      /* adminSets */ [],
      /* editorSets */ [],
      ["editor", "admin"],
    );
    if (authResult.success === false) {
      return res.status(authResult.status).json({ error: authResult.error });
    }
    const { action, payload } = req.body || {};
    switch (action) {
      case "list-staged":
        return res.json(await listStaged(payload));
      case "approve-staged":
        return res.json(await approveStaged(payload));
      case "reject-staged":
        return res.json(await rejectStaged(payload));
      case "clear-staged":
        return res.json(await clearStaged(payload));
      case "trigger-generation":
        return res.json(await triggerGeneration(payload));
      default:
        return res.status(400).json({ error: "Invalid action" });
    }
  } catch (err) {
    return res.status(500).json({ error: "Internal error" });
  }
}
```

### Environment Variables

- AI / ppq.ai:
  - `AI_API_URL` — base URL to ppq.ai endpoint
  - `AI_AUTH_KEY` — bearer token or api key
  - `PPQ_MODEL_ID` — default model id (search-capable)
  - `MAX_ITERATIONS` — validation loop cap (e.g., 3)
- Email (IMAP):
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USERNAME`, `EMAIL_PASSWORD`, `EMAIL_TLS`
  - `EMAIL_FOLDER` (default `INBOX`)
- Redis:
  - `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or `REDIS_URL`)
- Storage (choose one):
  - Vercel Blob: `BLOB_READ_WRITE_TOKEN`
  - S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET`
- Google OAuth (Gmail IMAP):
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `GMAIL_REFRESH_TOKEN`
  - Optional for local dev: `GOOGLE_REDIRECT_URI`

`.env.example` (template):

```env
# AI
AI_API_URL=https://api.ppq.ai/v1/chat/completions
AI_AUTH_KEY=
PPQ_MODEL_ID=ppq-search-pro
MAX_ITERATIONS=3

# EMAIL (IMAP)
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_TLS=true
EMAIL_FOLDER=INBOX

# REDIS (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# STORAGE (choose one)
BLOB_READ_WRITE_TOKEN=
# or S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
S3_BUCKET=

# GOOGLE OAUTH (Gmail IMAP XOAUTH2)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GMAIL_REFRESH_TOKEN=
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
```

### Open Questions / Decisions Needed

- **ppq.ai request/response contract**: confirm exact API path and schema.
- **Storage choice**: Vercel Blob vs S3 (cost, retention, access model).
- **Cron cadence**: desired schedule (e.g., every 15 or 30 minutes?).
- **De-dup basis**: subject-only (current) vs `Message-ID` for stronger uniqueness.
- **Mark-as-seen**: do we mark emails read or rely solely on Redis?
- **Concurrency**: allow parallel email processing or keep sequential for simplicity.
- **Redis structure**: confirm ZSET + HASH for staged items vs simple Set.
- **Admin UI flow**: confirm paging and sorting; define max items per page.
- **Gmail refresh policy**: decide failure threshold to raise `needs_attention` and whether to auto-refresh proactively (<5m TTL).

### Helper Example — Mark Email as Read

```js
async function markEmailAsRead({ accessToken, messageId }) {
  const { google } = require("googleapis");
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}
```

### Next Implementation Steps

- Scaffold `api/ai.ts` (staging cron) and `api/ai-automation.ts` (admin dispatcher) plus `api-helpers/ai/*`.
- Implement Gmail API fetch with `googleapis` (list unread, get message details, mark as read).
- Implement parsing with `turndown` + storage of parsed markdown.
- Implement candidate extraction + scoring prompt; write to Redis (ZSET + HASH).
- Implement admin dispatcher with `authenticateNIP98` and actions (list/approve/reject/clear/trigger).
- Implement generation/validation loop for approved items using ppq.ai.
- Implement storage for final reports (Blob or S3).
- Wire Redis global lock and Gmail OAuth token manager (cache + refresh).
- Add `vercel.json` cron and deploy with env vars.
