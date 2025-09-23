import type { RedisClient } from "../common.js";
import { authenticateNIP98, ErrorResponseCreator, fetchNostrSets } from "../common_with_client.js";

import { handleAddArticle, handleRemoveArticle, handlePublishArticle } from "./articles.js";
import { handleDeleteBlossomMedia } from "./blossom/delete.js";
import { handleFetchBlobLists } from "./blossom/list.js";
import { handleMirrorBlossomMedia } from "./blossom/mirror.js";
import { handleUpdateBlossomServers } from "./blossom/servers.js";
import { handleUploadBlossomMedia } from "./blossom/upload.js";
import { handleTriggerDeploy } from "./deploy.js";
import { handleAddNews, handlePublishNews, handleRemoveNews } from "./news.js";
import { handlePublishPodcast, handleRemovePodcast } from "./podcasts.js";
import { handleGetScrapes, handleRefreshScrapes } from "./scrapes.js";
import { handleUpdateTags } from "./tags.js";
import { handleTranslateNews } from "./translate.js";
import { handleUploadToX } from "./twitter.js";
import { handleAddAdmin, handleAddEditor, handleRemoveAdmin, handleRemoveEditor } from "./users.js";

export async function handleAdminPost(redis: RedisClient, request: Request): Promise<Response> {
  try {
    const { adminUsers, editorUsers, articleTags, newsTags, podcastTags } = await fetchNostrSets([
      "admin-users",
      "editor-users",
      "articles",
      "news",
      "podcasts",
    ]);

    const authResult = await authenticateNIP98(
      request.headers.get("Authorization") || "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (authResult.success === false) {
      return ErrorResponseCreator(authResult.error, authResult.status);
    }

    const masterAdminPrivateKey = process.env.MASTER_ADMIN_PRIVATEKEY;

    if (!masterAdminPrivateKey) {
      return ErrorResponseCreator("Master admin private key not configured", 500);
    }

    const contentType = request.headers.get("content-type")?.toLowerCase() || "";

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
          return ErrorResponseCreator("Twitter credentials not configured", 500);
        }

        const firstPost = String(form.get("firstPost"));
        const secondPost = String(form.get("secondPost"));
        const type = String(form.get("type"));
        const slug = String(form.get("slug"));

        if (!firstPost || !secondPost || !slug || !type) {
          return ErrorResponseCreator("First post, second post and slug are required", 400);
        }

        if (type !== "news" && type !== "podcast" && type !== "article") {
          return ErrorResponseCreator("Invalid type", 400);
        }

        return handleUploadToX({
          TWITTER_API_KEY,
          TWITTER_API_SECRET,
          TWITTER_ACCESS_TOKEN,
          TWITTER_ACCESS_TOKEN_SECRET,
          authResult,
          paramsData: { formData: form, firstPost, secondPost, type, slug },
        });
      }

      if (action === "upload-blossom-media") {
        const serversRaw = String(form.get("servers") || "");
        const servers = serversRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (!servers.length) {
          return ErrorResponseCreator("At least one Blossom server is required", 400);
        }

        const optimize = String(form.get("optimize") || "false").toLowerCase() === "true";
        const generateBlurHash =
          String(form.get("generateBlurHash") || "false").toLowerCase() === "true";
        const format = String(form.get("format") || "webp").toLowerCase() as
          | "webp"
          | "avif"
          | "jpeg";

        const qualityVal = Number(String(form.get("quality") || "82"));
        const quality = Number.isFinite(qualityVal) ? qualityVal : 82;
        const maxWidthVal = Number(String(form.get("maxWidth") || ""));
        const maxWidth = Number.isFinite(maxWidthVal) ? maxWidthVal : null;

        return handleUploadBlossomMedia(redis, masterAdminPrivateKey, authResult, {
          formData: form,
          servers,
          optimize,
          generateBlurHash,
          format,
          quality,
          maxWidth,
        });
      }

      return ErrorResponseCreator("Invalid action for multipart request", 400);
    }

    const requestBody = await request.json();
    const { action } = requestBody || {};

    switch (action) {
      case "trigger-deploy":
        return handleTriggerDeploy(request);
      case "get-scrapes":
        return handleGetScrapes(redis, authResult);
      case "refresh-scrapes":
        return handleRefreshScrapes(redis, authResult);
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
      case "publish-article":
        return handlePublishArticle(masterAdminPrivateKey, articleTags, authResult, requestBody);
      case "publish-podcast":
        return handlePublishPodcast(masterAdminPrivateKey, podcastTags, authResult, requestBody);
      case "remove-podcast":
        return handleRemovePodcast(masterAdminPrivateKey, podcastTags, authResult, requestBody);
      case "translate-news":
        return handleTranslateNews(authResult, requestBody);
      case "update-tags":
        return handleUpdateTags(masterAdminPrivateKey, authResult, requestBody);
      case "update-blossom-servers":
        return handleUpdateBlossomServers(redis, masterAdminPrivateKey, authResult, requestBody);
      case "fetch-blob-lists":
        return handleFetchBlobLists(redis, masterAdminPrivateKey, authResult, requestBody);
      case "mirror-blossom-media":
        return handleMirrorBlossomMedia(redis, masterAdminPrivateKey, authResult, requestBody);
      case "delete-blossom-media":
        return handleDeleteBlossomMedia(redis, masterAdminPrivateKey, authResult, requestBody);
      default:
        return ErrorResponseCreator("Invalid action", 400);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to handle admin post");

    return ErrorResponseCreator(err, 500);
  }
}
