import { createRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// Enable client-side hydration for dynamic routes (like admin panel)
// The main page (/) is static, but admin panel needs interactivity
createRoot(document.getElementById("root")!).render(<HydratedRouter />);
