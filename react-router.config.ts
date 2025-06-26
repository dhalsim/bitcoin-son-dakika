import type { Config } from "@react-router/dev/config";

export default {
  // Use src directory instead of app
  appDirectory: "src",
  
  // Disable SSR for main app - we only want static pre-rendering
  ssr: false,
  
  // Enable static pre-rendering for main site
  async prerender() {
    return [
      "/", // Ana sayfa - Bitcoin Son Dakika
    ];
  },
} satisfies Config; 