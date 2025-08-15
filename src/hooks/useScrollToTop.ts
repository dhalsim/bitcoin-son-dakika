import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Hook that scrolls to top of page on route change
 * This ensures that when users navigate between pages, they start at the top
 * Uses instant scrolling for better performance and user experience
 */
export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    console.log("Route changed to:", pathname, "Scrolling to top...");

    const scrollToTop = () => {
      console.log("Executing scroll to top...");

      if (typeof window !== "undefined") {
        // Try multiple methods to ensure compatibility
        window.scrollTo(0, 0);

        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }

        if (document.body) {
          document.body.scrollTop = 0;
        }

        console.log("Scroll to top completed");
      }
    };

    // Try multiple timing approaches
    // 1. Immediate
    scrollToTop();

    // 2. After DOM update
    requestAnimationFrame(scrollToTop);

    // 3. After a small delay as fallback
    setTimeout(scrollToTop, 50);

    // 4. After a longer delay as final fallback
    setTimeout(scrollToTop, 200);
  }, [pathname]);
}
