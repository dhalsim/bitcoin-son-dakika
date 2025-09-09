import { TranslationServiceClient } from "@google-cloud/translate";

import type { TranslateNewsPayload } from "../../src/types/admin.js";
import type { AuthResult } from "../types.js";
import { ErrorResponseCreator, SuccessResponse } from "../utils.js";

export async function handleTranslateNews(
  authResult: AuthResult,
  requestBody: TranslateNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponseCreator("Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponseCreator("Only editors can translate news", 403);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    return ErrorResponseCreator("Google application credentials not configured", 500);
  }

  if (!process.env.GOOGLE_PROJECT_ID) {
    return ErrorResponseCreator("Google project ID not configured", 500);
  }

  try {
    const credentialsJson = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

    const client = new TranslationServiceClient({
      credentials: credentialsJson,
    });

    const [translations] = await client.translateText({
      parent: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/global`,
      mimeType: "text/plain",
      contents: requestBody.textToTranslate,
      targetLanguageCode: requestBody.targetLanguageCode,
    });

    return SuccessResponse({ translations });
  } catch (error) {
    return ErrorResponseCreator(error || "Failed to translate news");
  }
}
