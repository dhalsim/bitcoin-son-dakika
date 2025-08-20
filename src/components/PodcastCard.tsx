import React from "react";
import { Link } from "react-router";
import { Clock, Play } from "lucide-react";

import type { PodcastItem } from "@/lib/ssg-data";
import { createTitleSlug } from "../../api-helpers/utils";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";

export interface PodcastCardProps {
  podcast: PodcastItem;
}

export const PodcastCard: React.FC<PodcastCardProps> = ({ podcast }) => {
  const url = `/podcast/${createTitleSlug(podcast.title)}`;

  return (
    <Card className="h-full flex flex-col">
      {podcast.image && (
        <div className="aspect-video overflow-hidden rounded-t-lg">
          <Link to={url}>
            <img
              src={podcast.image}
              alt={podcast.title || "Podcast görseli"}
              className="w-full h-full object-cover"
            />
          </Link>
        </div>
      )}

      <CardHeader className="flex-1 pt-3">
        <div className="flex items-start justify-between mb-2">
          {podcast.episodeNumber && (
            <Link to={url}>
              <Badge variant="secondary" className="text-xs">
                Bölüm {podcast.episodeNumber}
              </Badge>
            </Link>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {podcast.duration}
          </div>
        </div>

        <CardTitle className="text-lg text-main-accent line-clamp-2 mb-2">
          <Link to={url}>{podcast.title || "Başlıksız Podcast"}</Link>
        </CardTitle>

        <p className="text-sm line-clamp-3 mb-4 text-muted-foreground">
          <Link to={url}>{podcast.summary}</Link>
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mt-auto space-y-2">
          {podcast.audioUrl && (
            <Button asChild className="w-full">
              <a href={podcast.audioUrl} target="_blank" rel="noopener noreferrer">
                <Play className="h-4 w-4 mr-2" />
                Dinle
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PodcastCard;
