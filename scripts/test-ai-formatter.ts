// run using: tsx scripts/test-ai-formatter.ts

import { readFileSync } from "fs";
import { config } from "dotenv";
import { join } from "path";

import type { ZeronoiseNewsItem } from "../api-helpers/admin/zeronoise/types.js";
import {
  buildFormattingPrompt,
  callAIService,
} from "../api-helpers/admin/zeronoise/ai-formatter.js";
import { parseEmailMarkdown } from "../api-helpers/admin/zeronoise/parser.js";

// Load environment variables
config({ path: ".env.local" });

// Test function for image search using Brave API
async function searchImagesForArticle(tags: string): Promise<string[]> {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    throw new Error("BRAVE_API_KEY is not set");
  }

  console.log("🖼️ Searching for images related to:", tags);

  const url = new URL("https://api.search.brave.com/res/v1/images/search");
  url.searchParams.set("q", tags);
  url.searchParams.set("safesearch", "strict");
  url.searchParams.set("count", "10");

  console.log("🔍 Search URL:", url.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Brave API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("🖼️ Brave API response:", JSON.stringify(data, null, 2));

  if (!data.results || !Array.isArray(data.results)) {
    throw new Error("Invalid response from Brave API");
  }

  // Extract image URLs from the results
  const imageUrls: string[] = [];

  for (const result of data.results) {
    if (result.properties && result.properties.url) {
      imageUrls.push(result.properties.url);
    } else if (result.thumbnail && result.thumbnail.src) {
      imageUrls.push(result.thumbnail.src);
    }
  }

  console.log("🖼️ Found image URLs:", imageUrls);

  return imageUrls;
}

// Load test data from existing files
function loadTestData(): ZeronoiseNewsItem {
  const testArticle = readFileSync(
    join(process.cwd(), "scripts", "zeronoise-parsed-emails", "email-199eb81a225fa831.md"),
    "utf-8",
  );

  const testItems = parseEmailMarkdown(testArticle);

  const testItem = testItems[0];

  if (!testItem) {
    throw new Error("No test item found");
  }

  return testItem;
}

// Main test function
async function runTests() {
  console.log("🚀 Starting AI Formatter Tests");
  console.log("=".repeat(50));

  // Check environment
  if (!process.env.PPQ_API_KEY) {
    console.error("❌ PPQ_API_KEY environment variable is not set");
    console.log("Please set it in your .env.local file");
    process.exit(1);
  }

  if (!process.env.BRAVE_API_KEY) {
    console.error("❌ BRAVE_API_KEY environment variable is not set");
    console.log("Please set it in your .env.local file");
    process.exit(1);
  }

  const item = loadTestData();

  try {
    // Test 1: Build formatting prompt
    console.log("1️⃣ Building formatting prompt...");
    const prompt = buildFormattingPrompt(item);
    console.log("✅ Prompt built successfully");
    console.log("📏 Prompt length:", prompt.length, "characters");

    // Test 2: Call AI service
    console.log("\n2️⃣ Calling AI service...");
    const formatted = await callAIService(prompt, item);

    const tags = formatted.tags.join(", ");

    console.log("✅ AI service completed successfully");
    console.log("📝 Formatted title:", formatted.title);
    console.log("📄 Summary:", formatted.summary.substring(0, 100) + "...");
    console.log("🏷️ Tags:", tags);

    // Test 3: Search for images
    console.log("\n3️⃣ Searching for images...");
    const images = await searchImagesForArticle(tags);
    console.log("✅ Image search completed");
    console.log("🖼️ Found images:", images.length);
    images.forEach((url, index) => {
      console.log(`   ${index + 1}. ${url}`);
    });

    // Test 4: Display full formatted content
    console.log("\n4️⃣ Full formatted content:");
    console.log("=".repeat(50));
    console.log("BAŞLIK:", formatted.title);
    console.log("\nÖZET:", formatted.summary);
    console.log("\nİÇERİK:");
    console.log(formatted.content);
    console.log("\nETİKETLER:", tags);

    console.log("=".repeat(50));
  } catch (error) {
    console.error(`❌ Error testing item:`, error);
  }

  console.log("\n🎉 All tests completed!");
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}
