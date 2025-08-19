import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  // can't use "admin" because it's reserved for admin worker function at /functions/admin.ts
  route("admin", "routes/admin.tsx"),
  route("news", "routes/news.tsx"),
  route("news/:slug", "routes/news-detail.tsx"),
  route("article/:slug", "routes/article-detail.tsx"),
  route("articles", "routes/articles.tsx"),
  route("podcasts", "routes/podcasts.tsx"),
  // TODO: add podcast detail page
  // route("podcast/:slug", "routes/podcast-detail.tsx"),
  route("son-dakika", "routes/latest.tsx"), // both news and articles
  route("tag/:slug", "routes/tags.tsx"),
  route("profile/:slug", "routes/profile.tsx"),
  route("test/:eventId", "routes/test-event.tsx"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
