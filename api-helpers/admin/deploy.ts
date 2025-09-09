import { ErrorResponseCreator, SuccessResponse } from "../utils.js";
import { authenticateNIP98, fetchNostrSets } from "../utils.js";

export async function handleTriggerDeploy(request: Request) {
  try {
    const { adminUsers, editorUsers } = await fetchNostrSets(["admin-users", "editor-users"]);

    const authResult = await authenticateNIP98(
      request.headers.get("Authorization") ?? "",
      adminUsers,
      editorUsers,
      ["editor", "admin"],
    );

    if (authResult.success === false) {
      return ErrorResponseCreator(authResult.error, authResult.status);
    }

    const deployHookUrl =
      "https://api.vercel.com/v1/integrations/deploy/prj_MgZWqBPzwJKbsZCUAy4r45WVHVpK/6EPluOk49C";

    const response = await fetch(deployHookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      return SuccessResponse({
        message: "Deploy hook triggered successfully",
        status: response.status,
        authorizedBy: authResult.pubkey,
        userRoles: authResult.roles,
      });
    } else {
      return ErrorResponseCreator("Failed to trigger deploy hook", response.status);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to trigger deploy hook");

    return ErrorResponseCreator(err, 500);
  }
}
