import type { Config } from "@react-router/dev/config";

export default {
  // Use src directory instead of app
  appDirectory: "src",
  
  // Disable SSR - we only want static pre-rendering
  ssr: false,
  
  // Enable static pre-rendering for SEO and performance
  async prerender() {
    return [
      "/", // Ana sayfa - Bitcoin Son Dakika
      "/admin", // Yönetim paneli
    ];
  },
} satisfies Config; 