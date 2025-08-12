import { TranslationServiceClient } from "@google-cloud/translate";

import type { AuthResult } from "../types.js";
import { ErrorResponse, SuccessResponse } from "../utils.js";

import type { TranslateNewsPayload } from "./types.js";

export async function handleTranslateNews(
  authResult: AuthResult,
  requestBody: TranslateNewsPayload,
) {
  if (!authResult.success) {
    return ErrorResponse(undefined, "Authentication failed", 401);
  }

  if (!authResult.roles.includes("editor")) {
    return ErrorResponse(undefined, "Only editors can translate news", 403);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return ErrorResponse(undefined, "Google application credentials not configured", 500);
  }

  if (!process.env.GOOGLE_PROJECT_ID) {
    return ErrorResponse(undefined, "Google project ID not configured", 500);
  }

  try {
    const client = new TranslationServiceClient();
    const [translations] = await client.translateText({
      parent: `projects/${process.env.GOOGLE_PROJECT_ID}/locations/global`,
      mimeType: "text/plain",
      contents: requestBody.textToTranslate,
      targetLanguageCode: requestBody.targetLanguageCode,
    });

    return SuccessResponse({ translations });
  } catch (error) {
    return ErrorResponse(error as Error);
  }
}
