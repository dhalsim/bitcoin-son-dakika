import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("admin", "routes/admin.tsx"),
  route("haberler", "routes/news.tsx"),
  route("haber/:slug", "routes/news-detail.tsx"),
  route("makale/:slug", "routes/article-detail.tsx"),
  route("makaleler", "routes/articles.tsx"),
  route("podcast", "routes/podcasts.tsx"),
  route("podcast/:slug", "routes/podcast-detail.tsx"),
  route("podcast-player/:slug", "routes/podcast-player.tsx"),
  // TODO: add educations - egitimler routes
  route("son-dakika", "routes/latest.tsx"), // both news and articles
  route("etiket/:slug", "routes/tags.tsx"),
  route("author/:slug", "routes/author.tsx"),
  route("test/:eventId", "routes/test-event.tsx"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
