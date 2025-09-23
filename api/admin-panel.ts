import { handleAdminPost } from "../api-helpers/admin/dispatcher.js";
import { getRedis } from "../api-helpers/common.js";
import {
  ErrorResponseCreator,
  SuccessResponse,
  fetchNostrSets,
} from "../api-helpers/common_with_client.js";

// Vercel Edge Function handler for GET requests
export async function GET(_request: Request) {
  try {
    const { adminUsers, editorUsers, articleTags, newsTags, podcastTags } = await fetchNostrSets([
      "admin-users",
      "editor-users",
      "articles",
      "news",
      "podcasts",
    ]);

    return SuccessResponse({
      adminUsers,
      editorUsers,
      articles: articleTags,
      news: newsTags,
      podcasts: podcastTags,
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error("Failed to fetch admin panel data");

    return ErrorResponseCreator(err, 500);
  }
}

// Vercel Edge Function handler for POST requests
export async function POST(request: Request) {
  const redis = await getRedis();

  return handleAdminPost(redis, request);
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
