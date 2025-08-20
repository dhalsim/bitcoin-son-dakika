import { LoaderFunctionArgs, MetaFunction, useParams, useLoaderData } from "react-router-dom";
import { Mic, Play, Clock, Calendar, User, ExternalLink, Download } from "lucide-react";

import { createTitleSlug } from "../../api-helpers/utils";

import { fetchSSGData } from "@/lib/ssg-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MainContent from "@/components/MainContent";
import ArticleMarkdownRenderer from "@/components/ui/ArticleMarkdownRenderer";
import AudioPlayer from "@/components/AudioPlayer";
import { formatNostrDate } from "@/lib/utils";

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

            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{podcast.author.display_name || podcast.author.name || "Anonim"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatNostrDate(podcast.publishedAt)}</span>
              </div>
            </div>

            {podcast.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {podcast.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
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
            <div className="mb-8">
              <p className="text-lg leading-relaxed">{podcast.summary}</p>
            </div>
          )}

          {/* Content */}
          <div className="mb-8">
            <ArticleMarkdownRenderer content={podcast.content} className="mb-8" />
          </div>

          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle>Yazar Hakkında</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {podcast.author.picture && (
                  <img
                    src={podcast.author.picture}
                    alt={podcast.author.display_name || podcast.author.name || "Yazar"}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">
                    {podcast.author.display_name || podcast.author.name || "Anonim"}
                  </h3>
                  {podcast.author.about && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      {podcast.author.about}
                    </p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={`/profile/${podcast.author.pubkey}`}>Profili Gör</a>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={`https://nostr.band/${podcast.author.pubkey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Nostr.band
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Paylaş</h3>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `${podcast.title} - Bitcoin Son Dakika Podcast`,
                  )}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Twitter'da Paylaş
                </a>
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                    window.location.href,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook'ta Paylaş
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainContent>
  );
}
