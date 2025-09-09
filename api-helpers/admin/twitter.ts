import crypto from "node:crypto";

import { ErrorResponseCreator } from "../utils.js";

import type { AuthResult, XAuthHeaderParams } from "./types.js";

function createXAuthHeader(params: XAuthHeaderParams): string {
  const {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
    method,
    url,
  } = params;
  const encodeRFC3986 = (str: string) =>
    encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: TWITTER_API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: TWITTER_ACCESS_TOKEN,
    oauth_version: "1.0",
  };

  const baseParams = { ...oauthParams };
  const paramsString = Object.keys(baseParams)
    .sort()
    .map((k) => `${encodeRFC3986(k)}=${encodeRFC3986(baseParams[k])}`)
    .join("&");
  const baseString = [method, encodeRFC3986(url), encodeRFC3986(paramsString)].join("&");
  const signingKey = `${encodeRFC3986(TWITTER_API_SECRET)}&${encodeRFC3986(TWITTER_ACCESS_TOKEN_SECRET)}`;
  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauthParams.oauth_signature = signature;

  return (
    "OAuth " +
    Object.keys(oauthParams)
      .map((k) => `${encodeRFC3986(k)}="${encodeRFC3986(oauthParams[k])}"`)
      .join(", ")
  );
}

type HandleUploadToXParams = {
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_TOKEN_SECRET: string;
  authResult: AuthResult;
  paramsData: { formData: FormData; firstPost: string; secondPost: string; slug: string };
};

export async function handleUploadToX(params: HandleUploadToXParams) {
  const {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
    authResult,
    paramsData,
  } = params;

  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can publish news", 403);
  }

  const { formData, firstPost, secondPost, slug } = paramsData;

  if (!formData) {
    return ErrorResponseCreator("File is required", 400);
  }

  const media = formData.get("media") as File | null;
  if (!media) {
    return ErrorResponseCreator("Media file missing", 400);
  }

  const xForm = new FormData();
  xForm.append("media", media);
  xForm.append("media_category", "tweet_image");

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
    headers: { Authorization: authHeader },
    body: xForm,
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text().catch(() => "");

    return ErrorResponseCreator(
      `X upload failed: ${uploadResponse.status} ${text}`,
      uploadResponse.status,
    );
  }

  try {
    const uploadJson = await uploadResponse.json();

    if (uploadJson.errors) {
      return ErrorResponseCreator(uploadJson.errors.map((e: any) => e.message).join(", "), 400);
    }

    const { media_id_string: mediaId } = uploadJson;

    if (!mediaId) {
      return ErrorResponseCreator("Media ID not found", 400);
    }

    const tweetUrl = "https://api.x.com/2/tweets";
    const tweetMethod = "POST";

    const tweetAuthHeader = createXAuthHeader({
      TWITTER_API_KEY,
      TWITTER_API_SECRET,
      TWITTER_ACCESS_TOKEN,
      TWITTER_ACCESS_TOKEN_SECRET,
      method: tweetMethod,
      url: tweetUrl,
    });

    const mediaTweetResponse = await fetch(tweetUrl, {
      method: tweetMethod,
      headers: { Authorization: tweetAuthHeader, "Content-Type": "application/json" },
      body: JSON.stringify({ media: { media_ids: [mediaId] }, text: firstPost }),
    });

    const mediaTweetJson = await mediaTweetResponse.json();

    const mediaTweetId = mediaTweetJson?.data?.id;
    const mediaTweetErrors = mediaTweetJson?.errors;

    if (mediaTweetErrors) {
      return ErrorResponseCreator(mediaTweetErrors.map((e: any) => e.message).join(", "), 400);
    }

    if (!mediaTweetId) {
      return ErrorResponseCreator("Reply to ID not found", 400);
    }

    const newsUrl = `https://bitcoinsondakika.com/haber/${slug}`;

    const replyTweetResponse = await fetch(tweetUrl, {
      method: tweetMethod,
      headers: { Authorization: tweetAuthHeader, "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: { in_reply_to_tweet_id: mediaTweetId },
        text: secondPost.replace("[link]", newsUrl),
      }),
    });

    const replyTweetJson = await replyTweetResponse.json();

    const replyTweetData = replyTweetJson?.data;
    const replyTweetErrors = replyTweetData?.errors;
    const replyTweetId = replyTweetData?.id;

    if (replyTweetErrors) {
      return ErrorResponseCreator(replyTweetErrors.map((e: any) => e.message).join(", "), 400);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Uploaded to X",
        data: { mediaTweetId, replyTweetId },
      }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } },
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to upload to X");

    return ErrorResponseCreator(err, 500);
  }
}
