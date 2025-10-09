/*
  YouTube transcript fetcher: Downloads subtitles/captions from a YouTube video
  and saves them as markdown.

  Env in .env.local (optional):
    YOUTUBE_VIDEO_ID=video_id_here
    YOUTUBE_LANG=en (default)

  Usage:
    npm i youtube-caption-extractor dotenv
    node scripts/fetch-youtube-transcript.cjs [VIDEO_ID] [LANG]
    
  Examples:
    node scripts/fetch-youtube-transcript.cjs dQw4w9WgXcQ
    node scripts/fetch-youtube-transcript.cjs dQw4w9WgXcQ tr
*/

const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(process.cwd(), ".env.local") });
const { getSubtitles, getVideoDetails } = require("youtube-caption-extractor");

// Get video ID from command line args or env
const videoID = process.argv[2] || process.env.YOUTUBE_VIDEO_ID;
const lang = process.argv[3] || process.env.YOUTUBE_LANG || "en";

if (!videoID) {
  console.error("Usage: node scripts/fetch-youtube-transcript.cjs VIDEO_ID [LANG]");
  console.error("Or set YOUTUBE_VIDEO_ID in .env.local");
  process.exit(1);
}

const fetchData = async (videoID, lang = "en") => {
  try {
    console.log(`Fetching transcript for video: ${videoID} (lang: ${lang})`);

    // Fetch video details including subtitles
    const videoDetails = await getVideoDetails({ videoID, lang });

    console.log(`\nTitle: ${videoDetails.title}`);
    console.log(`Description: ${videoDetails.description?.substring(0, 200)}...`);

    // Fetch subtitles
    const subtitles = await getSubtitles({ videoID, lang });

    if (!subtitles || subtitles.length === 0) {
      console.error("No subtitles found for this video in the specified language.");
      process.exit(1);
    }

    console.log(`\nFound ${subtitles.length} subtitle entries`);

    // Convert subtitles array to markdown
    let markdown = `# ${videoDetails.title}\n\n`;
    markdown += `**Video ID:** ${videoID}\n`;
    markdown += `**Language:** ${lang}\n`;
    markdown += `**URL:** https://www.youtube.com/watch?v=${videoID}\n\n`;

    if (videoDetails.description) {
      markdown += `## Description\n\n${videoDetails.description}\n\n`;
    }

    markdown += `## Transcript\n\n`;

    // Add each subtitle entry
    for (const subtitle of subtitles) {
      // Format: [00:00:00] Text
      const timestamp = formatTimestamp(subtitle.start);
      markdown += `**[${timestamp}]** ${subtitle.text}\n\n`;
    }

    // Also create a plain text version (just the text, no timestamps)
    let plainText = subtitles.map((s) => s.text).join(" ");

    // Save both versions
    const baseFilename = `youtube-${videoID}-${lang}`;
    const markdownFile = `${baseFilename}.md`;
    const textFile = `${baseFilename}.txt`;

    fs.writeFileSync(markdownFile, markdown);
    fs.writeFileSync(textFile, plainText);

    console.log(`\n✓ Saved markdown transcript to: ${markdownFile}`);
    console.log(`✓ Saved plain text transcript to: ${textFile}`);
    console.log(`\nTotal characters: ${plainText.length}`);
  } catch (error) {
    console.error("Error fetching data:", error.message);
    if (error.message.includes("Could not find captions")) {
      console.error("\nTip: This video may not have captions in the specified language.");
      console.error("Try a different language code (e.g., 'en', 'tr', 'es', 'fr')");
    }
    process.exit(1);
  }
};

// Helper function to format seconds to HH:MM:SS
function formatTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [hours, minutes, secs].map((n) => String(n).padStart(2, "0")).join(":");
}

// Run the fetch
fetchData(videoID, lang);
