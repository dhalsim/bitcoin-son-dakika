import { createTitleSlug } from "api-helpers/utils";

import { WEBSITE_URL, LOGO_FOR_PODCAST_URL } from "../constants";
import type { PodcastItem } from "../ssg-data";
import { formatDuration, formatRssDate, links } from "../utils";

// Function to get file size from URL (returns 0 if unable to determine)
const getAudioFileSize = async (audioUrl: string): Promise<number> => {
  try {
    // Check if we're in a Node.js environment and have access to fetch
    if (typeof fetch === "undefined") {
      console.warn("Fetch not available, skipping file size check for:", audioUrl);

      return 0;
    }

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout")), 5000);
    });

    const fetchPromise = fetch(audioUrl, { method: "HEAD" });

    // Race between fetch and timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]);

    if (response.ok) {
      const contentLength = response.headers.get("content-length");

      return contentLength ? parseInt(contentLength, 10) : 0;
    }
  } catch (error) {
    // Log warning but don't fail the build
    console.warn(`Could not determine file size for ${audioUrl}:`, error);
  }

  return 0;
};

const generatePodcastItemXml = async (podcast: PodcastItem) => {
  const pubDate = formatRssDate(podcast.publishedAt);
  const imageUrl = podcast.image || `${WEBSITE_URL}/${LOGO_FOR_PODCAST_URL}`;
  const transcriptUrl = podcast.transcriptUrl;
  const chaptersUrl = podcast.chaptersUrl;
  const episodeNumber = podcast.episodeNumber;
  const duration = formatDuration(podcast.duration);

  // Determine audio type based on URL extension
  const audioType = podcast.audioUrl.endsWith(".mp3") ? "audio/mp3" : "audio/mpeg";

  // Get file size for the audio file
  const fileSize = await getAudioFileSize(podcast.audioUrl);

  // Create tags string for description
  const tagsString =
    podcast.tagItems.length > 0
      ? `Etiketler: ${podcast.tagItems.map((tagItem) => tagItem.tag).join(", ")}`
      : "";

  // Create summary content
  const summaryContent = podcast.summary
    ? `${podcast.summary}\n\n${tagsString}`
    : `${podcast.content.substring(0, 300)}...\n\n${tagsString}`;

  return `
    <item>
      <title>${podcast.title || "Başlıksız Podcast"}</title>
      <link>https://bitcoinsondakika.com/${links.podcastDetail(createTitleSlug(podcast.title))}</link>
      <guid isPermaLink="true">https://bitcoinsondakika.com/${links.podcastDetail(createTitleSlug(podcast.title))}</guid>
      <pubDate>${pubDate}</pubDate>
      ${podcast.audioUrl ? `<enclosure url="${podcast.audioUrl}" length="${fileSize}" type="${audioType}"/>` : ""}
      <itunes:episode>${episodeNumber}</itunes:episode>
      <itunes:season>1</itunes:season>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:author>${podcast.author.display_name || podcast.author.name || "Bitcoinsondakika.com"}</itunes:author>
      <itunes:explicit>no</itunes:explicit>
      <itunes:image href="${imageUrl}"/>
      <itunes:summary><![CDATA[${summaryContent}]]></itunes:summary>
      <itunes:duration>${duration}</itunes:duration>
      <itunes:subtitle>${podcast.summary ? podcast.summary.substring(0, 255) : podcast.title}</itunes:subtitle>
      <description><![CDATA[${summaryContent}]]></description>
      <language>tr-TR</language>
      
      <podcast:episode>${episodeNumber}</podcast:episode>
      <podcast:season>1</podcast:season>
      <podcast:medium>podcast</podcast:medium>
      <podcast:duration>${duration}</podcast:duration>
      ${transcriptUrl ? `<podcast:transcript url="${transcriptUrl}" type="text/vtt" language="tr" rel="captions"/>` : ""}
      ${chaptersUrl ? `<podcast:chapters url="${chaptersUrl}" type="application/json+chapters"/>` : ""}
    </item>`;
};

export const generatePodcastRssXml = async (podcasts: PodcastItem[]) => {
  const lastBuildDate = new Date().toUTCString();
  const sortedPodcasts = [...podcasts].sort((a, b) => b.publishedAt - a.publishedAt);

  const podcastItemsXml = await Promise.all(sortedPodcasts.map(generatePodcastItemXml)).then(
    (items) => items.join(""),
  );

  const logoUrl = `${WEBSITE_URL}/${LOGO_FOR_PODCAST_URL}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
	xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
	xmlns:atom="http://www.w3.org/2005/Atom"
	xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Bitcoinsondakika.com</title>
    <link>${WEBSITE_URL}${links.podcasts}</link>
    <language>tr-TR</language>
    <copyright>Copyright © ${new Date().getFullYear()} Bitcoinsondakika.com. All rights reserved.</copyright>
    <podcast:guid>5ce054d6-a6ed-55b4-8020-4a11479899af</podcast:guid>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <itunes:author>Bitcoinsondakika.com</itunes:author>
    <itunes:explicit>no</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:summary>Bitcoin dünyasından haberler, uzman görüşleri, analizler ve bitcoin ile ilgili makaleleri tartışıyoruz.</itunes:summary>
    <description><![CDATA[Bitcoin dünyasından haberler, uzman görüşleri, analizler ve bitcoin ile ilgili makaleleri tartışıyoruz.]]></description>
    <itunes:category text="News">
      <itunes:category text="Tech News"/>
    </itunes:category>
    <itunes:owner>
      <itunes:name>Bitcoinsondakika.com</itunes:name>
      <itunes:email>bitcoinsondakika@proton.me</itunes:email>
    </itunes:owner>
    <image>
      <url>${logoUrl}</url>
      <title>Bitcoinsondakika.com</title>
      <link>${WEBSITE_URL}${links.podcasts}</link>
    </image>
    <itunes:image href="${logoUrl}"/>
    <podcast:image href="${logoUrl}"/>
    <podcast:medium>podcast</podcast:medium>
    <atom:link href="https://bitcoinsondakika.com/feed/podcast-rss.xml" rel="self" type="application/rss+xml"/>
    
    ${podcastItemsXml}
  </channel>
</rss>`;
};
