import type { ZeronoiseNewsItem } from "./types.js";

export function parseEmailMarkdown(markdown: string): ZeronoiseNewsItem[] {
  const items: ZeronoiseNewsItem[] = [];

  // Split content by lines for easier processing
  const lines = markdown.split("\n");
  let currentItem: Partial<ZeronoiseNewsItem> | null = null;
  let currentContent: string[] = [];
  let itemIndex = 0;

  // Skip sections we don't want to parse as news items
  const skipSections = [
    "QUICK STATS",
    "TODAY'S BITCOIN LANDSCAPE",
    "Coverage:",
    "You received this email",
    "Manage email preferences",
    "View in browser",
    "© 2025 ZeroNoise",
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) {
      if (currentContent.length > 0) {
        currentContent.push("");
      }

      continue;
    }

    // Check if this is a section we should skip
    const shouldSkip = skipSections.some(
      (section) => line.includes(section) || line.startsWith(section),
    );

    if (shouldSkip) {
      // If we were building an item, finish it
      if (currentItem && currentContent.length > 0) {
        currentItem.content = currentContent.join("\n").trim();
        items.push(currentItem as ZeronoiseNewsItem);
        currentItem = null;
        currentContent = [];
      }

      continue;
    }

    // Check if this is a news item header (### Title)
    if (line.startsWith("### ")) {
      // If we were building a previous item, finish it
      if (currentItem && currentContent.length > 0) {
        currentItem.content = currentContent.join("\n").trim();
        items.push(currentItem as ZeronoiseNewsItem);
      }

      // Start new item
      const title = line.replace(/^###\s*/, "").trim();
      currentItem = {
        index: itemIndex++,
        title: title,
        content: "",
      };
      currentContent = [];
      continue;
    }

    // If we're building an item, add this line to content
    if (currentItem) {
      currentContent.push(line);
    }
  }

  // Don't forget the last item
  if (currentItem && currentContent.length > 0) {
    currentItem.content = currentContent.join("\n").trim();

    items.push(currentItem as ZeronoiseNewsItem);
  }

  return items;
}
