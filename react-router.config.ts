import type { Config } from "@react-router/dev/config";

export default {
  // Use src directory instead of app
  appDirectory: "src",
  
  ssr: false,
  
  // Use route discovery for client-side routing
  routeDiscovery: {
    mode: "initial"
  },
  
  // Enable static pre-rendering for main site (SSG mode)
  async prerender() {
    return [
      "/", // Ana sayfa - Bitcoin Son Dakika
      "/admin-panel", // Admin panel - client-side only, publicly accessible
    ];
  },
} satisfies Config; 