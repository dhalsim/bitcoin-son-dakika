import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Play } from "lucide-react";

import type { PodcastItem } from "@/lib/ssg-data";
import { formatDuration } from "@/lib/utils";

import { createTitleSlug } from "../../api-helpers/common_with_client";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { CategoryTags } from "./CategoryTags";
import { EventStatistics } from "./EventStatistics";

export interface PodcastCardProps {
  podcast: PodcastItem;
}

export const PodcastCard: React.FC<PodcastCardProps> = ({ podcast }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  const url = `/podcast/${createTitleSlug(podcast.title)}`;
  const titleText = `Podcast - ${podcast.title}`;

  const summaryToRender = isExpanded ? podcast.summary : podcast.summary?.slice(0, 200) + "…";

  const handlePlayClick = () => {
    navigate(url, { state: { autoplay: true } });
  };

  const wrapInLink = (element: React.ReactNode, className?: string) => {
    return url ? (
      <Link to={url} className={className}>
        {element}
      </Link>
    ) : (
      element
    );
  };

  const titleElement = wrapInLink(
    <>{titleText}</>,
    "hover:text-main-accent decoration-main-accent",
  );

  const imageElement = wrapInLink(
    <img src={podcast.image} alt={podcast.title} className="w-full h-full object-cover" />,
    "hover:opacity-80 transition-opacity cursor-pointer",
  );

  return (
    <Card className="h-full flex flex-col">
      {podcast.image && (
        <div className="relative aspect-video overflow-hidden rounded-t-lg group">
          {imageElement}
          <div className="absolute top-2 sm:top-4 left-2 sm:left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:block hidden">
            <CategoryTags tagItems={podcast.tagItems} size="xs" />
          </div>
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
            {formatDuration(podcast.duration)}
          </div>
        </div>

        <CardTitle className="text-lg line-clamp-2 mb-2">{titleElement}</CardTitle>

        <p className="text-sm mb-4 text-muted-foreground">
          <Link to={url}>{summaryToRender}</Link>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="align-baseline text-main-accent decoration-main-accent font-medium cursor-pointer hover:underline underline-offset-4 ml-2"
          >
            {isExpanded ? "Daha az göster" : "Devamını oku"}
          </button>
        </p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mt-auto space-y-2">
          <Button onClick={handlePlayClick} className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Dinle
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <EventStatistics
            event={podcast.event}
            author={podcast.author}
            isPodcast={true}
            className="justify-start"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PodcastCard;
