import { useEffect, useState } from "react";
import { Mic, Play, Clock, Calendar, User } from "lucide-react";
import { LoaderFunctionArgs, MetaFunction, useLoaderData } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { PodcastItem, SSGData } from "@/lib/ssg-data";
import { fetchSSGData } from "@/lib/ssg-data";
import { createTitleSlug } from "../../api-helpers/utils";

export const meta: MetaFunction = () => {
  const description =
    "Bitcoin dünyasından haberler, uzman görüşleri, analizler ve bitcoin ile ilgili makaleleri tartışıyoruz.";

  return [
    { title: "Podcastler - Bitcoin Son Dakika" },
    {
      name: "description",
      content: description,
    },
    { property: "og:title", content: "Podcastler - Bitcoin Son Dakika" },
    {
      property: "og:description",
      content: description,
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://bitcoinsondakika.com/podcasts" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Podcastler - Bitcoin Son Dakika" },
    {
      name: "twitter:description",
      content: description,
    },
  ];
};

export async function loader({}: LoaderFunctionArgs) {
  try {
    const ssgData = await fetchSSGData();

    return { podcasts: ssgData.podcasts, lastUpdated: ssgData.lastUpdated };
  } catch (error) {
    console.error("Error loading podcast data:", error);

    return { podcasts: [], lastUpdated: Date.now() };
  }
}

export default function PodcastsPage() {
  const { podcasts } = useLoaderData<typeof loader>();
  const [filteredPodcasts, setFilteredPodcasts] = useState<PodcastItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "title" | "episode">("date");

  useEffect(() => {
    let filtered = podcasts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (podcast) =>
          podcast.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          podcast.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          podcast.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "episode":
          if (a.episodeNumber && b.episodeNumber) {
            return a.episodeNumber - b.episodeNumber;
          }
          return 0;
        case "date":
        default:
          return b.publishedAt - a.publishedAt;
      }
    });

    setFilteredPodcasts(filtered);
  }, [podcasts, searchTerm, sortBy]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (duration?: string) => {
    if (!duration) return "";
    return duration;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Mic className="h-12 w-12 text-red-500 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground">Podcastler</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Bitcoin dünyasından en güncel podcast bölümleri. Uzman görüşleri, analizler ve detaylı
            açıklamalar.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Ara
              </Label>
              <Input
                id="search"
                placeholder="Podcast ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={sortBy}
                onValueChange={(value: "date" | "title" | "episode") => setSortBy(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Tarihe göre</SelectItem>
                  <SelectItem value="title">Başlığa göre</SelectItem>
                  <SelectItem value="episode">Bölüm numarasına göre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            {filteredPodcasts.length} podcast bulundu
          </p>
        </div>

        {/* Podcasts Grid */}
        {filteredPodcasts.length === 0 ? (
          <div className="text-center py-12">
            <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
              Podcast bulunamadı
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Arama kriterlerinize uygun podcast bulunamadı.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredPodcasts.map((podcast) => (
              <Card key={podcast.id} className="h-full flex flex-col">
                {podcast.image && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={podcast.image}
                      alt={podcast.title || "Podcast görseli"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    {podcast.episodeNumber && (
                      <Badge variant="secondary" className="text-xs">
                        Bölüm {podcast.episodeNumber}
                      </Badge>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {podcast.duration && formatDuration(podcast.duration)}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 mb-2">
                    {podcast.title || "Başlıksız Podcast"}
                  </CardTitle>
                  {podcast.summary && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4">
                      {podcast.summary}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <User className="h-4 w-4" />
                    <span>{podcast.author.display_name || podcast.author.name || "Anonim"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(podcast.publishedAt)}</span>
                  </div>

                  {podcast.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {podcast.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {podcast.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{podcast.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-auto space-y-2">
                    {podcast.audioUrl && (
                      <Button asChild className="w-full">
                        <a href={podcast.audioUrl} target="_blank" rel="noopener noreferrer">
                          <Play className="h-4 w-4 mr-2" />
                          Dinle
                        </a>
                      </Button>
                    )}
                    <Button asChild variant="outline" className="w-full">
                      <a href={`/podcast/${createTitleSlug(podcast.title)}`}>Detayları Gör</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
