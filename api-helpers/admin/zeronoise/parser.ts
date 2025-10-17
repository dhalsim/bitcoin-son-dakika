import type { ZeronoiseNewsItem } from "./types.js";

export function extractDateFromMarkdown(markdown: string, fallbackDate: string): string {
  // 1. Try to extract from "Coverage:" line (alternative format)
  const coverageMatch = markdown.match(/Coverage:\s*(.+?)(?:\n|$)/i);
  if (coverageMatch) {
    try {
      // Parse "October 15, 2025 - October 16, 2025" format
      const coverageStr = coverageMatch[1].trim();
      const dateParts = coverageStr.split(" - ");
      const datePart = dateParts.length > 1 ? dateParts[1] : dateParts[0]; // Take the end date (October 16)
      const parsedDate = new Date(datePart);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    } catch (_error) {
      console.warn(`Failed to parse coverage date: ${coverageMatch[1]}`);
    }
  }

  // 2. Fallback to provided date
  try {
    return new Date(fallbackDate).toISOString();
  } catch (_error) {
    console.warn(`Failed to parse fallback date: ${fallbackDate}`);

    return new Date().toISOString(); // Ultimate fallback
  }
}

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
