import type { Context } from "./types";
import {
  authenticateNIP98,
  ErrorResponse,
  SuccessResponse,
  CorsResponse,
  fetchNostrSets,
} from "./utils";

export async function onRequestPost(context: Context) {
  try {
    const { adminUsers, editorUsers } = await fetchNostrSets();

    // Authenticate user - require editor role for deployment
    const authResult = await authenticateNIP98(
      context.request,
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    // All checks passed, trigger the deployment
    const deployHookUrl =
      "https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/b504e75c-7d2d-44e4-853e-d3c754a2a955";

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
      return ErrorResponse(
        undefined,
        "Failed to trigger deploy hook",
        response.status,
      );
    }
  } catch (error) {
    return ErrorResponse(error);
  }
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return CorsResponse();
}
