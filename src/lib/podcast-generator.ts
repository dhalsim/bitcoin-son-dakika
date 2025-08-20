import { createTitleSlug } from "../../api-helpers/utils";

import type { PodcastItem } from "./ssg-data";
import { formatNostrDate } from "./utils";

const generatePodcastItemXml = (podcast: PodcastItem) => {
  const pubDate = formatNostrDate(podcast.publishedAt);
  const imageUrl = podcast.image || "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png";
  const transcriptUrl = podcast.transcriptUrl;
  const chaptersUrl = podcast.chaptersUrl;
  const episodeNumber = podcast.episodeNumber;
  const duration = podcast.duration;

  // Determine audio type based on URL extension
  const audioType = podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg";

  // Create tags string for description
  const tagsString = podcast.tags.length > 0 ? `Tags: ${podcast.tags.join(", ")}` : "";

  // Create summary content
  const summaryContent = podcast.summary
    ? `${podcast.summary}\n\n${tagsString}`
    : `${podcast.content.substring(0, 300)}...\n\n${tagsString}`;

  return `
    <item>
      <title>${podcast.title || "Başlıksız Podcast"}</title>
      <link>https://bitcoinsondakika.com/podcast/${createTitleSlug(podcast.title)}</link>
      <guid isPermaLink="true">https://bitcoinsondakika.com/podcast/${createTitleSlug(podcast.title)}</guid>
      <pubDate>${pubDate}</pubDate>
      ${podcast.audioUrl ? `<enclosure url="${podcast.audioUrl}" length="0" type="${audioType}"/>` : ""}
      <itunes:episode>${episodeNumber}</itunes:episode>
      <itunes:season>1</itunes:season>
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:author>${podcast.author.display_name || podcast.author.name || "Bitcoinsondakika.com"}</itunes:author>
      <itunes:explicit>no</itunes:explicit>
      <itunes:image href="${imageUrl}"/>
      <itunes:summary><![CDATA[${summaryContent}]]></itunes:summary>
      <itunes:duration>${duration}</itunes:duration>
      <description><![CDATA[${summaryContent}]]></description>
      
      <podcast:episode>${episodeNumber}</podcast:episode>
      <podcast:season>1</podcast:season>
      <podcast:medium>podcast</podcast:medium>
      <podcast:duration>${duration}</podcast:duration>
      ${transcriptUrl ? `<podcast:transcript url="${transcriptUrl}" type="text/vtt" language="tr" rel="captions"/>` : ""}
      ${chaptersUrl ? `<podcast:chapters url="${chaptersUrl}" type="application/json+chapters"/>` : ""}
    </item>`;
};

export const generatePodcastRssXml = (podcasts: PodcastItem[]) => {
  const lastBuildDate = new Date().toUTCString();
  const sortedPodcasts = [...podcasts].sort((a, b) => b.publishedAt - a.publishedAt);

  const podcastItemsXml = sortedPodcasts.map(generatePodcastItemXml).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
	xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
	xmlns:atom="http://www.w3.org/2005/Atom"
	xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>Bitcoinsondakika.com</title>
    <link>https://bitcoinsondakika.com/podcasts</link>
    <language>tr-TR</language>
    <podcast:guid>5ce054d6-a6ed-55b4-8020-4a11479899af</podcast:guid>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <itunes:author>Bitcoinsondakika.com</itunes:author>
    <itunes:explicit>no</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:summary>Bitcoin dünyasından haberler, uzman görüşleri, analizler ve bitcoin ile ilgili makaleleri tartışıyoruz.</itunes:summary>
    <description><![CDATA[Bitcoin dünyasından haberler, uzman görüşleri, analizler ve bitcoin ile ilgili makaleleri tartışıyoruz.]]></description>
    <itunes:category text="Technology">
      <itunes:category text="Tech News"/>
    </itunes:category>
    <image>
      <url>https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png</url>
      <title>Bitcoinsondakika.com</title>
      <link>https://bitcoinsondakika.com/podcasts</link>
    </image>
    <itunes:image href="https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png"/>
    <podcast:image href="https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png"/>
    <podcast:medium>podcast</podcast:medium>
    <atom:link href="https://bitcoinsondakika.com/podcasts/podcast-rss.xml" rel="self" type="application/rss+xml"/>
    
    ${podcastItemsXml}
  </channel>
</rss>`;
};
