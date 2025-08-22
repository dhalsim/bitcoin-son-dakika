import { handleAdminPost } from "../api-helpers/admin/dispatcher.js";
import { ErrorResponseCreator, SuccessResponse, fetchNostrSets } from "../api-helpers/utils.js";

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
    return ErrorResponseCreator(error);
  }
}

// Vercel Edge Function handler for POST requests
export async function POST(request: Request) {
  return handleAdminPost(request);
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
