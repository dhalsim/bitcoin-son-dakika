import {
  LoaderFunctionArgs,
  MetaFunction,
  useLoaderData,
  Link,
  useLocation,
} from "react-router-dom";
import { Mic, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { createTitleSlug } from "../../api-helpers/utils";

import { createAuthorSlug, fetchSSGData, getDisplayName } from "@/lib/ssg-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MainContent from "@/components/MainContent";
import ArticleMarkdownRenderer from "@/components/ArticleMarkdownRenderer";
import AudioPlayer, { AudioPlayerRef } from "@/components/AudioPlayer";
import { EventStatistics } from "@/components/EventStatistics";
import { CategoryTags } from "@/components/CategoryTags";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { LOGO_URL, WEBSITE_NAME, WEBSITE_URL } from "@/lib/constants";
import { RssButton } from "@/components/RssButton";
import { getTimeAgo, links } from "@/lib/utils";

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  const podcast = loaderData?.podcast;

  if (!podcast) {
    return [
      { title: `Podcast Bulunamadı - ${WEBSITE_NAME}` },
      { name: "description", content: "Aradığınız podcast bulunamadı." },
      { property: "og:title", content: `Podcast Bulunamadı - ${WEBSITE_NAME}` },
      { property: "og:description", content: "Aradığınız podcast bulunamadı." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: `Podcast Bulunamadı - ${WEBSITE_NAME}` },
      { name: "twitter:description", content: "Aradığınız podcast bulunamadı." },
      { name: "twitter:card", content: "summary" },
    ];
  }

  // Add null checks for required podcast properties
  if (!podcast.title || !podcast.audioUrl) {
    console.error("Podcast data is incomplete:", podcast);

    return [
      { title: `Podcast Hatası - ${WEBSITE_NAME}` },
      { name: "description", content: "Podcast bilgileri eksik." },
      { property: "og:title", content: `Podcast Hatası - ${WEBSITE_NAME}` },
      { property: "og:description", content: "Podcast bilgileri eksik." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: `Podcast Hatası - ${WEBSITE_NAME}` },
      { name: "twitter:description", content: "Podcast bilgileri eksik." },
      { name: "twitter:card", content: "summary" },
    ];
  }

  const title = `Podcast - ${podcast.title} - ${WEBSITE_NAME}`;
  const description =
    podcast.summary?.substring(0, 200) || podcast.content?.substring(0, 160) || "Bitcoin podcast";
  const imageUrl = podcast.image ? podcast.image : `${WEBSITE_URL}/${LOGO_URL}`;
  const canonicalUrl = `${WEBSITE_URL}/podcast/${createTitleSlug(podcast.title)}`;

  // Add tags for better SEO
  const tags =
    podcast.tagItems?.length > 0 ? `bitcoin, btc, ${podcast.tagItems.join(", ")}` : "bitcoin, btc";

  return [
    // Browser tab title - This is what shows in the browser tab
    { title: title },
    // Meta description - This is what shows in search results
    {
      name: "description",
      content: description,
    },
    // Canonical URL
    { rel: "canonical", href: canonicalUrl },
    {
      name: "keywords",
      content: tags,
    },
    // Open Graph tags - These are the most important for social media previews
    { property: "og:title", content: title },
    {
      property: "og:description",
      content: description,
    },
    { property: "og:site_name", content: WEBSITE_NAME },
    { property: "og:type", content: "music.radio_station" },
    { property: "og:url", content: canonicalUrl },
    { property: "og:image", content: imageUrl },
    { property: "og:audio", content: podcast.audioUrl },
    {
      property: "og:audio:type",
      content: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
    },
    { property: "og:audio:title", content: title },
    { property: "og:audio:artist", content: WEBSITE_NAME },
    { property: "og:audio:duration", content: podcast.duration || "" },
    { property: "og:audio:album", content: `${WEBSITE_NAME} Podcast` },
    { property: "og:audio:track", content: podcast.episodeNumber?.toString() || "1" },

    // Twitter Card tags - These are important for Twitter and other platforms
    { name: "twitter:card", content: "player" },
    { name: "twitter:title", content: title },
    {
      name: "twitter:description",
      content: description,
    },
    { property: "twitter:image", content: imageUrl },
    { name: "twitter:player", content: canonicalUrl },
    { name: "twitter:player:width", content: "435" },
    { name: "twitter:player:height", content: "251" },

    // Podcast-specific meta tags
    { name: "medium", content: "audio" },
    { name: "content-type", content: "podcast" },
    { name: "audio", content: podcast.audioUrl },
    { name: "audio:type", content: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg" },
    { name: "podcast:episode", content: podcast.episodeNumber?.toString() || "1" },
    { name: "podcast:season", content: "1" },
    { name: "podcast:duration", content: podcast.duration || "" },
    { name: "podcast:explicit", content: "false" },
    { name: "podcast:type", content: "episodic" },
    { name: "format", content: "audio" },
    { name: "content-format", content: "podcast" },
    { name: "media-type", content: "audio" },
    { name: "content-category", content: "podcast" },
    { name: "content-subcategory", content: "bitcoin" },
    { name: "application-name", content: `${WEBSITE_NAME} Podcast` },
    { name: "category", content: "podcast" },
    { name: "subject", content: "Bitcoin Podcast" },
    { name: "classification", content: "podcast" },
    { name: "content-classification", content: "podcast" },
    { name: "content-genre", content: "bitcoin" },
    { name: "content-language", content: "tr-TR" },
    { name: "content-locale", content: "tr_TR" },
    { name: "content-encoding", content: "UTF-8" },
    { name: "content-charset", content: "UTF-8" },
    { name: "content-version", content: "1.0" },
    { name: "content-status", content: "published" },

    // Enclosure for RSS compatibility
    {
      rel: "enclosure",
      type: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
      href: podcast.audioUrl,
    },

    // Note: Structured data (JSON-LD) should be added in the component's JSX, not in meta tags
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { slug } = params;

    if (!slug) {
      throw new Error("Podcast slug is required");
    }

    const ssgData = await fetchSSGData();

    // Find podcast by slug using createTitleSlug function
    const foundPodcast = ssgData.podcasts.find((p) => {
      if (!p.title) {
        return false;
      }

      return createTitleSlug(p.title) === slug;
    });

    if (!foundPodcast) {
      throw new Error("Podcast not found");
    }

    return { podcast: foundPodcast };
  } catch (error) {
    console.error("Error loading podcast:", error);

    return { podcast: null };
  }
}

export default function PodcastDetailPage() {
  const { podcast } = useLoaderData<typeof loader>();
  const location = useLocation();
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [hasAutoplayAttempted, setHasAutoplayAttempted] = useState(false);

  // Auto-play when autoplay is in location state
  useEffect(() => {
    const shouldAutoplay = location.state?.autoplay === true && !hasAutoplayAttempted;

    if (shouldAutoplay && audioPlayerRef.current && podcast.audioUrl) {
      // Small delay to ensure AudioPlayer is fully mounted
      const timer = setTimeout(() => {
        audioPlayerRef.current?.play();
        setHasAutoplayAttempted(true);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [location.state, podcast.audioUrl, hasAutoplayAttempted]);

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">
            Podcast Bulunamadı
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Aradığınız podcast bulunamadı.</p>
          <Button asChild>
            <a href={links.podcasts}>Tüm Podcastlere Dön</a>
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return "";
    return formatDuration(duration);
  };

  const time = getTimeAgo(podcast.publishedAt);
  const displayName = getDisplayName(podcast.author, podcast.event.pubkey);

  return (
    <MainContent>
      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PodcastEpisode",
            name: podcast.title,
            description: podcast.summary || podcast.title,
            image: podcast.image || `${WEBSITE_URL}/logo-for-podcast.png`,
            url: `${WEBSITE_URL}/podcast/${createTitleSlug(podcast.title)}`,
            audio: {
              "@type": "AudioObject",
              contentUrl: podcast.audioUrl,
              encodingFormat: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
              duration: formatDuration(podcast.duration),
            },
            author: {
              "@type": "Person",
              name: podcast.author?.name || WEBSITE_NAME,
            },
            publisher: {
              "@type": "Organization",
              name: WEBSITE_NAME,
              url: WEBSITE_URL,
            },
            datePublished: podcast.publishedAt * 1000,
            duration: formatDuration(podcast.duration),
            keywords:
              podcast.tagItems?.length > 0
                ? `bitcoin, btc, ${podcast.tagItems.join(", ")}`
                : "bitcoin, btc",
            episodeNumber: podcast.episodeNumber,
            seasonNumber: 1,
            partOfSeries: {
              "@type": "PodcastSeries",
              name: `${WEBSITE_NAME} Podcast`,
              url: `${WEBSITE_URL}${links.podcasts}`,
            },
          }),
        }}
      />
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back button */}
          <div className="mb-6">
            <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-400">
              <a href={links.podcasts}>← Tüm Podcastlere Dön</a>
            </Button>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              {podcast.episodeNumber && (
                <Badge variant="secondary" className="text-sm">
                  Bölüm {podcast.episodeNumber}
                </Badge>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {podcast.duration && formatDuration(podcast.duration)}
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">
              {podcast.title}
            </h1>

            {/* Author and Time */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
              <div className="flex flex-col">{time}</div>
              <div className="text-xs text-muted-foreground">
                <Link
                  to={links.author(createAuthorSlug(displayName))}
                  className="text-foreground font-medium hover:text-main-accent transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <ProfileAvatar
                      pubkey={podcast.author.pubkey}
                      profile={podcast.author}
                      disablePopup={true}
                      size="md"
                    />
                    <div className="font-medium text-foreground">{displayName}</div>
                  </div>
                </Link>
              </div>
            </div>

            <CategoryTags tagItems={podcast.tagItems} className="mb-4" />

            {/* Podcast RSS Feed Link */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 mt-4">
              <RssButton text="RSS Feed'e Abone Ol" variant="blue" />
            </div>
          </div>

          {/* Image and Audio Player */}
          <div className="mb-8">
            {podcast.image && (
              <div className="aspect-video overflow-hidden rounded-lg mb-6">
                <img
                  src={podcast.image}
                  alt={podcast.title || "Podcast görseli"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {podcast.audioUrl && (
              <AudioPlayer
                ref={audioPlayerRef}
                audioUrl={podcast.audioUrl}
                title={podcast.title}
                chaptersUrl={podcast.chaptersUrl}
                transcriptUrl={podcast.transcriptUrl}
                duration={podcast.duration}
                event={podcast.event}
              />
            )}
          </div>

          {/* Summary */}
          {podcast.summary && (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
              <h3 className="text-lg font-semibold text-orange-800 dark:text-blue-300 mb-3">
                Özet
              </h3>
              <p className="text-lg leading-relaxed text-orange-900 dark:text-blue-400 ">
                {podcast.summary}
              </p>
            </div>
          )}

          {/* Content */}
          <div className="mb-8">
            <ArticleMarkdownRenderer content={podcast.content} className="mb-8" />
          </div>

          {/* Event Statistics */}
          <div className="border-t border-border pt-6">
            <EventStatistics
              event={podcast.event}
              author={podcast.author}
              isPodcast={true}
              className="justify-start"
            />
          </div>
        </div>
      </div>
    </MainContent>
  );
}
