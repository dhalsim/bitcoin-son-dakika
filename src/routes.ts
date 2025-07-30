import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  // can't use "admin" because it's reserved for admin worker function at /functions/admin.ts
  route("admin-panel", "routes/admin.tsx"),
  route("news", "routes/news.tsx"),
  route("articles", "routes/articles.tsx"),
  route("enson", "routes/latest.tsx"),
  route("tag/:tagStr", "routes/tags.tsx"),
  route("profile/:slug", "routes/profile.tsx"),
  route("test/:eventId", "routes/test-event.tsx"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
