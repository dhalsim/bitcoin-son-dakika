import crypto from "node:crypto";

import { hexToBytes } from "@noble/hashes/utils";
import { finalizeEvent, nip19 } from "nostr-tools";

import type { AuthResult } from "../api-helpers/types.js";
import type { ArticleTag, NewsTag } from "../api-helpers/utils.js";
import {
  ErrorResponse,
  SuccessResponse,
  ADMIN_RELAYS,
  authenticateNIP98,
  fetchNostrSets,
  PublishEventResponse,
  createTitleSlug,
} from "../api-helpers/utils.js";
import { publishToRelays } from "../src/lib/utils.js";

// Vercel Edge Function handler for GET requests
export async function GET(_request: Request) {
  try {
    // For GET requests, return public admin data (no authentication required for viewing)
    const { adminUsers, editorUsers, articleTags, newsTags } = await fetchNostrSets([
      "admin-users",
      "editor-users",
      "articles",
      "news",
    ]);

    return SuccessResponse({
      adminUsers,
      editorUsers,
      articles: articleTags,
      news: newsTags,
    });
  } catch (error) {
    console.error("Admin GET error:", error);

    return ErrorResponse(error);
  }
}

// Vercel Edge Function handler for POST requests
export async function POST(request: Request) {
  try {
    const { adminUsers, editorUsers, articleTags, newsTags } = await fetchNostrSets([
      "admin-users",
      "editor-users",
      "articles",
      "news",
    ]);

    console.log({
      adminUsers,
      editorUsers,
      articles: articleTags,
      news: newsTags,
    });

    // MANDATORY AUTHENTICATION for all POST actions
    const authResult = await authenticateNIP98(
      request.headers.get("Authorization") || "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (authResult.success === false) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    const contentType = request.headers.get("content-type")?.toLowerCase() || "";

    // If multipart, parse as FormData and route accordingly (used for upload-to-x)
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const action = form.get("action");

      if (action === "upload-to-x") {
        const {
          TWITTER_API_KEY,
          TWITTER_API_SECRET,
          TWITTER_ACCESS_TOKEN,
          TWITTER_ACCESS_TOKEN_SECRET,
        } = process.env;

        if (
          !TWITTER_API_KEY ||
          !TWITTER_API_SECRET ||
          !TWITTER_ACCESS_TOKEN ||
          !TWITTER_ACCESS_TOKEN_SECRET
        ) {
          return ErrorResponse(undefined, "Twitter credentials not configured", 500);
        }

        const title = String(form.get("title") || "");

        return handleUploadToX({
          TWITTER_API_KEY,
          TWITTER_API_SECRET,
          TWITTER_ACCESS_TOKEN,
          TWITTER_ACCESS_TOKEN_SECRET,
          authResult,
          paramsData: {
            action: "upload-to-x",
            formData: form,
            title,
          },
        });
      }

      return ErrorResponse(undefined, "Invalid action for multipart request", 400);
    }

    const masterAdminPrivateKey = process.env.MASTER_ADMIN_PRIVATEKEY;

    if (!masterAdminPrivateKey) {
      return ErrorResponse(undefined, "Master admin private key not configured", 500);
    }

    // Otherwise, parse JSON
    const requestBody = await request.json();
    const { action } = requestBody;

    switch (action) {
      case "trigger-deploy":
        return handleTriggerDeploy(request);
      case "add-editor-pubkey":
        return handleAddEditor(masterAdminPrivateKey, editorUsers, authResult, requestBody);
      case "remove-editor-pubkey":
        return handleRemoveEditor(masterAdminPrivateKey, editorUsers, authResult, requestBody);
      case "add-admin-pubkey":
        return handleAddAdmin(masterAdminPrivateKey, adminUsers, authResult, requestBody);
      case "remove-admin-pubkey":
        return handleRemoveAdmin(masterAdminPrivateKey, adminUsers, authResult, requestBody);
      case "add-article":
        return handleAddArticle(masterAdminPrivateKey, articleTags, authResult, requestBody);
      case "add-news":
        return handleAddNews(masterAdminPrivateKey, newsTags, authResult, requestBody);
      case "remove-news":
        return handleRemoveNews(masterAdminPrivateKey, newsTags, authResult, requestBody);
      case "remove-article":
        return handleRemoveArticle(masterAdminPrivateKey, articleTags, authResult, requestBody);
      case "publish-news":
        return handlePublishNews(masterAdminPrivateKey, newsTags, authResult, requestBody);
      default:
        return ErrorResponse(undefined, "Invalid action", 400);
    }
  } catch (error) {
    console.error("Admin POST error:", error);

    return ErrorResponse(error);
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Max-Age": "86400",
    },
  });
}

// Helper functions for user management

// Action handlers
interface AdminActionData {
  pubkey?: string;
}

type AddArticlePayload =
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; a: string; relay: string };

type AddArticleResolvedPayload = {
  aTag: string;
  relayTag: string;
  action: "add-article";
};

type AddNewsPayload = {
  action: "add-news";
  eventId: string;
  relay: string;
};

type RemoveNewsPayload = {
  action: "remove-news";
  eventId: string;
  relay: string;
};

type RemoveArticlePayload = {
  action: "remove-article";
  aTag: string;
  relay: string;
};

type PublishNewsPayload = {
  action: "publish-news";
  content: string;
  title: string;
  summary?: string;
  image?: string;
  tags: string[];
};

type UploadToXPayload = {
  action: "upload-to-x";
  formData: FormData;
  title: string;
};

/** Editor Handlers */

async function handleAddNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: AddNewsPayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can add news
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can add news", 403);
  }

  const { eventId, relay } = data;

  if (!eventId || !relay) {
    return ErrorResponse(undefined, "Event ID and relay are required", 400);
  }

  // Check if news already exists
  const existingNews = currentNews.find(
    (news) => news.eTag === data.eventId && news.relay === data.relay,
  );

  if (existingNews) {
    return ErrorResponse(undefined, "News already exists", 409);
  }

  try {
    const result = await addNews(masterAdminPrivateKey, currentNews, data);

    return PublishEventResponse(
      {
        message: `News added successfully`,
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error adding news:", error);

    return ErrorResponse(error);
  }
}

async function handleRemoveNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: RemoveNewsPayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can remove news
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can remove news", 403);
  }

  const { eventId, relay } = data;
  if (!eventId || !relay) {
    return ErrorResponse(undefined, "Event ID and relay are required", 400);
  }

  return await removeNews(masterAdminPrivateKey, currentNews, data);
}

async function handleAddArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
  data: AddArticlePayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can add articles
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can add articles", 403);
  }

  let aTag: string;
  let relayTag: string;

  if (data.type === "naddr") {
    try {
      const decoded = nip19.decode(data.naddr);
      if (decoded.type !== "naddr") {
        return ErrorResponse(undefined, "Invalid naddr format", 400);
      }

      aTag = `${decoded.data.kind}:${decoded.data.pubkey}:${decoded.data.identifier}`;
      relayTag = decoded.data.relays?.[0] || "wss://relay.damus.io";
    } catch {
      return ErrorResponse(undefined, "Invalid naddr", 400);
    }
  } else {
    aTag = data.a;
    relayTag = data.relay;
  }

  if (!aTag || !relayTag) {
    return ErrorResponse(undefined, "Article data is required", 400);
  }

  return await addArticle(masterAdminPrivateKey, currentArticles, {
    aTag,
    relayTag,
    action: data.action,
  });
}

async function handleRemoveArticle(
  masterAdminPrivateKey: string,
  currentArticles: ArticleTag[],
  authResult: AuthResult,
  data: RemoveArticlePayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can remove articles
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can remove articles", 403);
  }

  const { aTag, relay } = data;
  if (!aTag || !relay) {
    return ErrorResponse(undefined, "Article data is required", 400);
  }

  return await removeArticle(masterAdminPrivateKey, currentArticles, data);
}

async function handlePublishNews(
  masterAdminPrivateKey: string,
  currentNews: NewsTag[],
  authResult: AuthResult,
  data: PublishNewsPayload,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can publish news
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can publish news", 403);
  }

  const { content, title } = data;
  if (!content || !title) {
    return ErrorResponse(undefined, "Content and title are required", 400);
  }

  return await publishNews(masterAdminPrivateKey, currentNews, authResult.pubkey, data);
}

/** Editor Actions */

async function addNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: AddNewsPayload,
) {
  const privateKeyBytes = hexToBytes(masterPrivateKey);
  const currentTime = Math.floor(Date.now() / 1000);

  // Create the event
  const eventTemplate = {
    kind: 30004,
    created_at: currentTime,
    tags: [
      ["d", "news"],
      ...currentNews.map((news) => ["e", news.eTag, news.relay]),
      ["e", data.eventId, data.relay],
    ],
    content: "",
  };

  const event = finalizeEvent(eventTemplate, privateKeyBytes);

  return await publishToRelays(event, ADMIN_RELAYS);
}

async function removeNews(
  masterPrivateKey: string,
  currentNews: { eTag: string; relay: string }[],
  data: RemoveNewsPayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Filter out the news item to be removed
    const toBeRemoved = currentNews.find((news) => news.eTag === data.eventId);

    // Check if the news item exists
    if (!toBeRemoved) {
      return ErrorResponse(undefined, "News item not found", 404);
    }

    // Create the event with the updated list
    const eventTemplate = {
      kind: 30004,
      created_at: currentTime,
      tags: [
        ["d", "news"],
        ...currentNews
          .filter((news) => news.eTag !== data.eventId)
          .map((news) => ["e", news.eTag, news.relay]),
      ],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse(
      {
        message: "News removed successfully",
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error removing news:", error);

    return ErrorResponse(error);
  }
}

async function addArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  data: AddArticleResolvedPayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Check if article already exists
    const existingArticle = currentArticles.find(
      (article) => article.aTag === data.aTag && article.relay === data.relayTag,
    );

    if (existingArticle) {
      return ErrorResponse(undefined, "Article already exists", 409);
    }

    // Create the event
    const eventTemplate = {
      kind: 30004,
      created_at: currentTime,
      tags: [
        ["d", "articles"],
        ...currentArticles.map((article) => ["a", article.aTag, article.relay]),
        ["a", data.aTag, data.relayTag],
      ],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse(
      {
        message: "Article added successfully",
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error adding article:", error);

    return ErrorResponse(error);
  }
}

async function removeArticle(
  masterPrivateKey: string,
  currentArticles: ArticleTag[],
  data: RemoveArticlePayload,
) {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Filter out the article to be removed
    const toBeRemoved = currentArticles.find(
      (article) => article.aTag === data.aTag && article.relay === data.relay,
    );

    // Check if the article exists
    if (!toBeRemoved) {
      return ErrorResponse(undefined, "Article not found", 404);
    }

    // Create the event with the updated list
    const eventTemplate = {
      kind: 30004,
      created_at: currentTime,
      tags: [
        ["d", "articles"],
        ...currentArticles
          .filter((article) => article.aTag !== data.aTag)
          .map((article) => ["a", article.aTag, article.relay]),
      ],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse(
      {
        message: "Article removed successfully",
        result,
      },
      data,
    );
  } catch (error) {
    console.error("Error removing article:", error);

    return ErrorResponse(error);
  }
}

async function publishNews(
  masterPrivateKey: string,
  currentNews: NewsTag[],
  userPubkey: string,
  data: PublishNewsPayload,
): Promise<Response> {
  try {
    const privateKeyBytes = hexToBytes(masterPrivateKey);
    const currentTime = Math.floor(Date.now() / 1000);

    // Prepare tags for the kind 1 event
    const eventTags = [
      ["title", data.title],
      ["editor", userPubkey],
      ...data.tags.map((tag) => ["t", tag]),
    ];

    // Add optional tags if provided
    if (data.summary) {
      eventTags.push(["summary", data.summary]);
    }

    if (data.image) {
      eventTags.push(["image", data.image]);
    }

    // Create the kind 1 event
    const eventTemplate = {
      kind: 1,
      created_at: currentTime,
      tags: eventTags,
      content: data.content,
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    const relay = result.find((r) => r.success)?.relay;

    if (!relay) {
      return ErrorResponse(undefined, "Failed to publish news", 500);
    }

    const addNewsResult = await addNews(masterPrivateKey, currentNews, {
      action: "add-news",
      eventId: event.id,
      relay,
    });

    if (addNewsResult.some((r) => r.success)) {
      return PublishEventResponse(
        {
          message: "News published successfully",
          result,
        },
        { eventId: event.id, relay, addNewsResult },
      );
    }

    return ErrorResponse(undefined, "Failed to publish news", 500);
  } catch (error) {
    console.error("Error publishing news:", error);

    return ErrorResponse(error);
  }
}

async function handleTriggerDeploy(request: Request) {
  try {
    const { adminUsers, editorUsers } = await fetchNostrSets(["admin-users", "editor-users"]);

    // Authenticate user - require editor role for deployment
    const authResult = await authenticateNIP98(
      request.headers.get("Authorization") ?? "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (authResult.success === false) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    // All checks passed, trigger the deployment
    const deployHookUrl =
      "https://api.vercel.com/v1/integrations/deploy/prj_MgZWqBPzwJKbsZCUAy4r45WVHVpK/6EPluOk49C";

    const response = await fetch(deployHookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      return SuccessResponse({
        message: "Deploy hook triggered successfully",
        status: response.status,
        authorizedBy: authResult.pubkey,
        userRoles: authResult.roles,
      });
    } else {
      return ErrorResponse(undefined, "Failed to trigger deploy hook", response.status);
    }
  } catch (error) {
    return ErrorResponse(error);
  }
}

type TwitterOAuthParams = {
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_TOKEN_SECRET: string;
};

type HandleUploadToXParams = TwitterOAuthParams & {
  authResult: AuthResult;
  paramsData: UploadToXPayload;
};

type XAuthHeaderParams = TwitterOAuthParams & {
  method: "POST" | "GET" | "PUT" | "DELETE";
  url: string;
};

function createXAuthHeader(params: XAuthHeaderParams): string {
  const {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
    method,
    url,
  } = params;

  // OAuth helper to percent-encode
  const encodeRFC3986 = (str) =>
    encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );

  const oauthParams = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  } as Record<string, string>;

  // Step 2: Create the signature base string
  const baseParams = {
    ...oauthParams,
  };

  const paramsString = Object.keys(baseParams)
    .sort()
    .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(baseParams[k])}`)
    .join("&");

  const baseString = [method, encodeRFC3986(url), encodeRFC3986(paramsString)].join("&");

  // Step 3: Create the signing key
  const signingKey = `${encodeRFC3986(TWITTER_API_SECRET)}&${encodeRFC3986(TWITTER_ACCESS_TOKEN_SECRET)}`;

  // Step 4: Generate signature
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = signature;

  // Step 5: Create Authorization header
  return (
    "OAuth " +
    Object.keys(oauthParams)
      .map((k) => `${encodeRFC3986(k)}="${encodeRFC3986(oauthParams[k])}"`)
      .join(", ")
  );
}

async function handleUploadToX(params: HandleUploadToXParams) {
  const {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
    authResult,
    paramsData,
  } = params;

  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only editors and admins can publish news
  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can publish news", 403);
  }

  const { formData, title } = paramsData;

  if (!formData) {
    return ErrorResponse(undefined, "File is required", 400);
  }

  // Build a clean form for X API: include only expected fields
  const media = formData.get("media") as File | null;

  if (!media) {
    return ErrorResponse(undefined, "Media file missing", 400);
  }

  const xForm = new FormData();
  xForm.append("media", new Blob([media]), "image.png");
  xForm.append("media_category", "tweet_image");
  xForm.append("media_type", "image/png");

  // X media upload uses v1.1 endpoint
  const mediaUploadUrl = "https://upload.twitter.com/1.1/media/upload.json";
  const mediaUploadMethod = "POST";

  const authHeader = createXAuthHeader({
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
    method: mediaUploadMethod,
    url: mediaUploadUrl,
  });

  const uploadResponse = await fetch(mediaUploadUrl, {
    method: mediaUploadMethod,
    headers: {
      Authorization: authHeader,
    },
    body: xForm,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => "");

    return ErrorResponse(
      undefined,
      `X upload failed: ${uploadResponse.status} ${text}`,
      uploadResponse.status,
    );
  }

  try {
    const uploadJson = await uploadResponse.json();

    if (uploadJson.errors) {
      return ErrorResponse(undefined, uploadJson.errors.map((e: any) => e.message).join(", "), 400);
    }

    const { media_id_string: mediaId } = uploadJson;

    if (!mediaId) {
      return ErrorResponse(undefined, "Media ID not found", 400);
    }

    try {
      const tweetUrl = "https://api.x.com/2/tweets";
      const tweetMethod = "POST";

      const authHeader = createXAuthHeader({
        TWITTER_API_KEY,
        TWITTER_API_SECRET,
        TWITTER_ACCESS_TOKEN,
        TWITTER_ACCESS_TOKEN_SECRET,
        method: tweetMethod,
        url: tweetUrl,
      });

      const mediaTweetResponse = await fetch(tweetUrl, {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media: { media_ids: [mediaId] },
          text: title,
        }),
      });

      const mediaTweetJson = await mediaTweetResponse.json();

      const { data } = mediaTweetJson;
      const { id: mediaTweetId, errors } = data;

      if (errors) {
        return ErrorResponse(undefined, errors.map((e: any) => e.message).join(", "), 400);
      }

      if (!mediaTweetId) {
        return ErrorResponse(undefined, "Reply to ID not found", 400);
      }

      const newsUrl = `https://bitcoinsindakika.com/news/${createTitleSlug(title)}`;

      const replyTweetResponse = await fetch(tweetUrl, {
        method: tweetMethod,
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reply: {
            in_reply_to_tweet_id: mediaTweetId,
          },
          text: `Haberin devamı için ve daha fazlası için: ${newsUrl}`,
        }),
      });

      const replyTweetJson = await replyTweetResponse.json();

      const { data: replyTweetData } = replyTweetJson;
      const { id: replyTweetId, errors: replyTweetErrors } = replyTweetData;

      if (replyTweetErrors) {
        return ErrorResponse(
          undefined,
          replyTweetErrors.map((e: any) => e.message).join(", "),
          400,
        );
      }

      return SuccessResponse({ message: "Uploaded to X", data: { mediaTweetId, replyTweetId } });
    } catch (error) {
      console.error(error);
    }
  } catch (error) {
    return ErrorResponse(error);
  }
}

/** Admin Handlers */

async function handleAddEditor(
  masterAdminPrivateKey: string,
  editorUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can add editors
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can add editors", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "editor-users",
    editorUsers,
    pubkey,
    "add",
  );
}

async function handleRemoveEditor(
  masterAdminPrivateKey: string,
  editorUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can remove editors
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can remove editors", 403);
  }

  const { pubkey } = data;

  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "editor-users",
    editorUsers,
    pubkey,
    "remove",
  );
}

async function handleAddAdmin(
  masterAdminPrivateKey: string,
  currentAdminUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can add other admins
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can add other admins", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "admin-users",
    currentAdminUsers,
    pubkey,
    "add",
  );
}

async function handleRemoveAdmin(
  masterAdminPrivateKey: string,
  currentAdminUsers: string[],
  authResult: AuthResult,
  data: AdminActionData,
) {
  // Type guard to ensure success
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  // Only admins can remove other admins
  if (!authResult.roles.includes("admin")) {
    return ErrorResponse(undefined, "Only admins can remove other admins", 403);
  }

  const { pubkey } = data;
  if (!pubkey) {
    return ErrorResponse(undefined, "Pubkey is required", 400);
  }

  return await updateNostrUserSet(
    masterAdminPrivateKey,
    "admin-users",
    currentAdminUsers,
    pubkey,
    "remove",
  );
}

/** Admin Actions */

async function updateNostrUserSet(
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
        return ErrorResponse(undefined, "User already exists", 409);
      }
    } else {
      if (!existingUser) {
        return ErrorResponse(undefined, "User not found", 404);
      }
    }

    const updatedUserTags =
      operation === "add"
        ? [...currentUsers.map((u) => ["p", u]), ["p", pubkey]]
        : currentUsers.filter((u) => u !== pubkey).map((u) => ["p", u]);

    // Create the event template
    const eventTemplate = {
      kind: 30000,
      created_at: currentTime,
      tags: [["d", setType], ...updatedUserTags],
      content: "",
    };

    const event = finalizeEvent(eventTemplate, privateKeyBytes);
    const result = await publishToRelays(event, ADMIN_RELAYS);

    return PublishEventResponse(
      {
        message: `${operation === "add" ? "Added" : "Removed"} ${pubkey} from ${setType}`,
        result,
      },
      { pubkey, setType, operation },
    );
  } catch (error) {
    console.error("Error updating Nostr user set:", error);

    return ErrorResponse(error);
  }
}
