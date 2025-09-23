import { LoaderFunctionArgs, MetaFunction, useLoaderData } from "react-router-dom";
import { useEffect, useRef } from "react";

import { SSGData } from "@/lib/ssg-data";
import { LOGO_URL, WEBSITE_NAME, WEBSITE_URL } from "@/lib/constants";
import { formatDuration } from "@/lib/utils";
import { links } from "@/lib/utils";

import { createTitleSlug } from "api-helpers/common_with_client";

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

    // Twitter Card tags - This is the actual player page, so we use player card
    { name: "twitter:card", content: "player" },
    { name: "twitter:title", content: title },
    {
      name: "twitter:description",
      content: description,
    },
    { property: "twitter:image", content: imageUrl },
    {
      name: "twitter:player",
      content: `${WEBSITE_URL}/podcast-player/${createTitleSlug(podcast.title)}`,
    },
    { name: "twitter:player:width", content: "435" },
    { name: "twitter:player:height", content: "251" },
    { name: "twitter:player:stream", content: podcast.audioUrl },
    {
      name: "twitter:player:stream:content_type",
      content: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
    },

    // Podcast-specific meta tags
    { name: "medium", content: "audio" },
    { name: "content-type", content: "podcast" },
    { name: "audio", content: podcast.audioUrl },
    { name: "audio:type", content: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg" },

    // Additional Twitter/X audio support
    { name: "twitter:audio", content: podcast.audioUrl },
    {
      name: "twitter:audio:type",
      content: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
    },
    { name: "twitter:audio:title", content: title },
    { name: "twitter:audio:artist", content: WEBSITE_NAME },
    { name: "twitter:audio:duration", content: podcast.duration || "" },
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

    // Get SSG data from global (available during prerendering)
    const ssgData: SSGData = (global as any).__SSG_DATA__;

    if (!ssgData) {
      throw new Response("SSG data not available", { status: 500 });
    }

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

export default function PodcastPlayerPage() {
  const { podcast } = useLoaderData<typeof loader>();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Auto-play when the page loads (for Twitter embedding)
    if (audioRef.current && podcast?.audioUrl) {
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        audioRef.current?.play().catch((error) => {
          console.log("Autoplay prevented:", error);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [podcast?.audioUrl]);

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">
            Podcast Bulunamadı
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Aradığınız podcast bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Twitter Player Card - Minimal, responsive design */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {podcast.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {podcast.summary?.substring(0, 150) ||
                  podcast.content?.substring(0, 150) ||
                  "Bitcoin podcast"}{" "}
                {podcast.summary && podcast.summary.length > 150 && (
                  <a
                    className="text-main-accent"
                    href={`/podcast/${createTitleSlug(podcast.title)}`}
                    target="_blank"
                  >
                    Devamını Oku
                  </a>
                )}
              </p>
            </div>

            {/* Audio Player */}
            <div className="p-6">
              <audio
                ref={audioRef}
                src={podcast.audioUrl}
                controls
                className="w-full h-12"
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>

              {/* Additional info */}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <a
                  className="text-main-accent"
                  href={`/podcast/${createTitleSlug(podcast.title)}`}
                  target="_blank"
                >
                  Bitcoin Son Dakika'da aç
                </a>
                {podcast.duration && (
                  <span>
                    {Math.floor(podcast.duration / 60)}:
                    {(podcast.duration % 60).toString().padStart(2, "0")}
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-center">
              <a className="text-main-accent" href={`/`} target="_blank">
                Bitcoin Son Dakika
              </a>
            </div>
          </div>
        </div>

        {/* Structured data for search engines */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "AudioObject",
              name: podcast.title,
              description: podcast.summary || podcast.title,
              contentUrl: podcast.audioUrl,
              encodingFormat: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
              duration: podcast.duration,
              author: {
                "@type": "Person",
                name: podcast.author?.name || "Bitcoin Son Dakika",
              },
              publisher: {
                "@type": "Organization",
                name: "Bitcoin Son Dakika",
              },
            }),
          }}
        />
      </div>
    </>
  );
}
