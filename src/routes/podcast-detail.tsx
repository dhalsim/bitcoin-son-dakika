import {
  LoaderFunctionArgs,
  MetaFunction,
  useLoaderData,
  Link,
  useSearchParams,
} from "react-router-dom";
import { Mic, Clock } from "lucide-react";
import { useEffect, useRef } from "react";

import { createTitleSlug } from "../../api-helpers/utils";
import { createProfileSlug, fetchSSGData, getDisplayName } from "@/lib/ssg-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MainContent from "@/components/MainContent";
import ArticleMarkdownRenderer from "@/components/ui/ArticleMarkdownRenderer";
import AudioPlayer, { AudioPlayerRef } from "@/components/AudioPlayer";
import { EventStatistics } from "@/components/EventStatistics";
import { CategoryTags } from "@/components/CategoryTags";
import { getTimeAgo } from "@/components/NewsCard";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";

export const meta: MetaFunction<typeof loader> = ({ loaderData }) => {
  const podcast = loaderData?.podcast;

  if (!podcast) {
    return [
      { title: "Podcast Bulunamadı - Bitcoin Son Dakika" },
      { name: "description", content: "Aradığınız podcast bulunamadı." },
    ];
  }

  return [
    { title: `${podcast.title} - Bitcoin Son Dakika` },
    {
      name: "description",
      content: podcast.summary || podcast.content.substring(0, 160),
    },
    { property: "og:title", content: `${podcast.title} - Bitcoin Son Dakika` },
    {
      property: "og:description",
      content: podcast.summary || podcast.content.substring(0, 160),
    },
    { property: "og:type", content: "article" },
    { property: "og:url", content: `https://bitcoinsondakika.com/podcast/${podcast.id}` },
    { property: "og:image", content: podcast.image },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: `${podcast.title} - Bitcoin Son Dakika` },
    {
      name: "twitter:description",
      content: podcast.summary || podcast.content.substring(0, 160),
    },
    { property: "twitter:image", content: podcast.image },
    { property: "og:audio", content: podcast.audioUrl },
    {
      rel: "enclosure",
      type: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
      href: podcast.audioUrl,
    },
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
  const [searchParams] = useSearchParams();
  const audioPlayerRef = useRef<AudioPlayerRef>(null);

  // Auto-play when autoplay query param is present
  useEffect(() => {
    const shouldAutoplay = searchParams.get("autoplay") === "true";
    if (shouldAutoplay && audioPlayerRef.current && podcast.audioUrl) {
      // Small delay to ensure AudioPlayer is fully mounted
      const timer = setTimeout(() => {
        audioPlayerRef.current?.play();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchParams, podcast.audioUrl]);

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
            <a href="/podcasts">Tüm Podcastlere Dön</a>
          </Button>
        </div>
      </div>
    );
  }

  const formatDuration = (duration?: string) => {
    if (!duration) return "";
    return duration;
  };

  const time = getTimeAgo(podcast.publishedAt);
  const displayName = getDisplayName(podcast.author, podcast.event.pubkey);

  return (
    <MainContent>
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Back button */}
          <div className="mb-6">
            <Button asChild variant="ghost" className="text-gray-600 dark:text-gray-400">
              <a href="/podcasts">← Tüm Podcastlere Dön</a>
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

            <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground mb-4">
              {podcast.title}
            </h1>

            {/* Author and Time */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
              <div className="flex flex-col">{time}</div>
              <div className="text-xs text-muted-foreground">
                <Link
                  to={`/profile/${createProfileSlug(displayName)}`}
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

            <CategoryTags tags={podcast.tags} className="mb-4" />
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
              />
            )}
          </div>

          {/* Summary */}
          {podcast.summary && (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg shadow-sm">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Özet</h3>
              <p className="text-lg leading-relaxed text-blue-800 dark:text-blue-200">
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
