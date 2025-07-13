import type { RouteConfig } from "@react-router/dev/routes";
import { index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  // can't use "admin" because it's reserved for admin worker function at /functions/admin.ts
  route("admin-panel", "routes/admin.tsx"),
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
