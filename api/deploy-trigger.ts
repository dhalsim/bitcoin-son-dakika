import {
  authenticateNIP98,
  ErrorResponse,
  SuccessResponse,
  fetchNostrSets,
} from "./utils";

// Vercel Edge Function handler for POST requests
export async function POST(request: Request) {
  try {
    const { adminUsers, editorUsers } = await fetchNostrSets();

    // Authenticate user - require editor role for deployment
    const authResult = await authenticateNIP98(
      request.headers.get("Authorization") ?? "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (!authResult.success) {
      return ErrorResponse(undefined, authResult.error, authResult.status);
    }

    // All checks passed, trigger the deployment
    // For Vercel, you'll need to set up a deployment webhook
    const deployHookUrl = process.env.VERCEL_DEPLOY_HOOK_URL;

    if (!deployHookUrl) {
      return ErrorResponse(undefined, "Deploy hook URL not configured", 500);
    }

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
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
