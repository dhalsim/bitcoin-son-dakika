import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, FileText, Newspaper, Tag, Clock } from "lucide-react";

import { assertUnreachable, formatNostrDate, links } from "@/lib/utils";

import { createTitleSlug, TagItem } from "api-helpers/common_with_client";

import { useSSGData } from "../contexts/SSGContext";
import type { NewsItem, ArticleItem, PodcastItem } from "../lib/ssg-data";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface SearchResult {
  type: "news" | "article" | "podcast" | "tag";
  item: NewsItem | ArticleItem | PodcastItem | TagItem;
  relevance: number;
  matchedFields: string[];
}

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const ssgData = useSSGData();

  // Search through SSG data
  const performSearch = useMemo(() => {
    if (!query.trim() || query.length < 2) {
      return [];
    }

    const searchQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    const searchContentItem = (item: NewsItem | ArticleItem | PodcastItem) => {
      let relevance = 0;
      const matchedFields: string[] = [];

      // Check title (highest priority)
      if (item.title?.toLowerCase().includes(searchQuery)) {
        relevance += 100;
        matchedFields.push("title");
      }

      // Check summary
      if (item.summary?.toLowerCase().includes(searchQuery)) {
        relevance += 50;
        matchedFields.push("summary");
      }

      // Check content
      if (item.content.toLowerCase().includes(searchQuery)) {
        relevance += 25;
        matchedFields.push("content");
      }

      item.tagItems.forEach((tagItem) => {
        const sanitizedTagItem = createTitleSlug(tagItem.tag);
        const sanitizedSearchQuery = createTitleSlug(searchQuery);

        if (
          sanitizedTagItem.includes(sanitizedSearchQuery) ||
          tagItem.label.toLowerCase().includes(searchQuery)
        ) {
          relevance += 30;
          matchedFields.push("tags");

          results.push({
            type: "tag",
            item: tagItem,
            relevance: 40,
            matchedFields: ["tag"],
          });
        }
      });

      if (relevance > 0) {
        results.push({
          type: item.type,
          item: item,
          relevance,
          matchedFields,
        });
      }
    };

    // Search through news
    ssgData.news.forEach(searchContentItem);

    // Search through articles
    ssgData.articles.forEach(searchContentItem);

    // Search through podcasts
    ssgData.podcasts.forEach(searchContentItem);

    // Sort by relevance and return top 20 results
    return results.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
  }, [query, ssgData]);

  // Update results when search query changes
  useEffect(() => {
    setResults(performSearch);
    setSelectedIndex(0);
  }, [performSearch]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleResultClick(results[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    if (result.type === "news") {
      const newsItem = result.item as NewsItem;
      const slug = newsItem.title ? createTitleSlug(newsItem.title) : newsItem.id;
      window.location.href = links.newsDetail(slug);
    } else if (result.type === "article") {
      const articleItem = result.item as ArticleItem;
      const slug = articleItem.title ? createTitleSlug(articleItem.title) : articleItem.id;
      window.location.href = links.articleDetail(slug);
    } else if (result.type === "tag") {
      const tagItem = result.item as TagItem;
      window.location.href = links.tag(tagItem.tag);
    } else if (result.type === "podcast") {
      const podcastItem = result.item as PodcastItem;
      const slug = podcastItem.title ? createTitleSlug(podcastItem.title) : podcastItem.id;
      window.location.href = links.podcastDetail(slug);
    } else {
      return assertUnreachable(result.type);
    }

    setIsOpen(false);
    setQuery("");
  };

  // Handle search input focus
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get display name for profile
  const getDisplayName = (profile: any) => {
    return profile.display_name || profile.name || `${profile.pubkey.slice(0, 8)}...`;
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Haber, makale veya etiket ara..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-4 py-2 w-48 sm:w-56 md:w-64 focus:w-56 sm:focus:w-64 md:focus:w-80 transition-all duration-300"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setQuery("")}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-96 overflow-y-auto z-search"
          style={{
            position: "absolute",
            isolation: "isolate",
            transform: "translateZ(0)",
            willChange: "transform",
            contain: "layout style paint",
          }}
        >
          {results.map((result, index) => {
            const isSelected = index === selectedIndex;

            return (
              <div
                key={`${result.type}-${index}`}
                className={`p-3 cursor-pointer border-b border-border last:border-b-0 hover:bg-accent ${
                  isSelected ? "bg-accent" : ""
                }`}
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {result.type === "news" && <Newspaper className="h-4 w-4 text-blue-500" />}
                    {result.type === "article" && <FileText className="h-4 w-4 text-green-500" />}
                    {result.type === "tag" && <Tag className="h-4 w-4 text-purple-500" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {result.type === "tag" ? (
                      <div>
                        <div className="font-medium text-foreground">
                          #{(result.item as TagItem).tag}
                        </div>
                        <div className="text-sm text-muted-foreground">Etiket</div>
                        <div className="text-xs text-muted-foreground">
                          {(result.item as TagItem).label}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-foreground line-clamp-2">
                          {result.type === "news"
                            ? (result.item as NewsItem).title || "Başlıksız Haber"
                            : (result.item as ArticleItem).title}
                        </div>

                        {(result.item as NewsItem | ArticleItem).summary && (
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {(result.item as NewsItem | ArticleItem).summary}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatNostrDate((result.item as NewsItem | ArticleItem).publishedAt)}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {getDisplayName((result.item as NewsItem | ArticleItem).author)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div
          className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg p-4 z-search"
          style={{
            position: "absolute",
            isolation: "isolate",
            transform: "translateZ(0)",
            willChange: "transform",
            contain: "layout style paint",
          }}
        >
          <div className="text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Sonuç bulunamadı</p>
            <p className="text-sm">Farklı anahtar kelimeler deneyin</p>
          </div>
        </div>
      )}
    </div>
  );
}
