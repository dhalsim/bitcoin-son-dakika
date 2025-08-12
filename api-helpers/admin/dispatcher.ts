import { authenticateNIP98, ErrorResponse, fetchNostrSets } from "../utils.js";

import { handleAddArticle, handleRemoveArticle } from "./articles.js";
import { handleTriggerDeploy } from "./deploy.js";
import { handleAddNews, handlePublishNews, handleRemoveNews } from "./news.js";
import { handleGetScrapes, handleRefreshScrapes } from "./scrapes.js";
import { handleTranslateNews } from "./translate.js";
import { handleUploadToX } from "./twitter.js";
import { handleAddAdmin, handleAddEditor, handleRemoveAdmin, handleRemoveEditor } from "./users.js";

export async function handleAdminPost(request: Request): Promise<Response> {
  try {
    const { adminUsers, editorUsers, articleTags, newsTags } = await fetchNostrSets([
      "admin-users",
      "editor-users",
      "articles",
      "news",
    ]);

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
          paramsData: { action: "upload-to-x", formData: form, title },
        });
      }

      return ErrorResponse(undefined, "Invalid action for multipart request", 400);
    }

    const masterAdminPrivateKey = process.env.MASTER_ADMIN_PRIVATEKEY;
    if (!masterAdminPrivateKey) {
      return ErrorResponse(undefined, "Master admin private key not configured", 500);
    }

    const requestBody = await request.json();
    const { action } = requestBody || {};

    switch (action) {
      case "trigger-deploy":
        return handleTriggerDeploy(request);
      case "get-scrapes":
        return handleGetScrapes(authResult);
      case "refresh-scrapes":
        return handleRefreshScrapes(authResult);
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
      case "translate-news":
        return handleTranslateNews(authResult, requestBody);
      default:
        return ErrorResponse(undefined, "Invalid action", 400);
    }
  } catch (error) {
    return ErrorResponse(error as Error);
  }
}
