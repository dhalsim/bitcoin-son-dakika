import {
  Search,
  Smile,
  Users,
  TreePine,
  UtensilsCrossed,
  Gamepad2,
  MapPin,
  Package,
  Shapes,
  Flag,
} from "lucide-react";
import React, { useState, useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCache } from "@/lib/cache";
import { DEFAULT_EMOJI_USAGE } from "@/lib/constants";
import type { EmojiCategories } from "@/types/emoji";

interface EmojiCategoryConfig {
  key: string;
  icon: React.ComponentType<{ className?: string }>;
}

const EMOJI_CATEGORIES: EmojiCategoryConfig[] = [
  { key: "Gülümseme & Duygular", icon: Smile },
  { key: "İnsan & Vücut", icon: Users },
  { key: "Hayvan & Doğa", icon: TreePine },
  { key: "Yemek & İçecek", icon: UtensilsCrossed },
  { key: "Etkinlik & Oyun", icon: Gamepad2 },
  { key: "Yolculuk & Yer", icon: MapPin },
  { key: "Nesneler", icon: Package },
  { key: "Semboller", icon: Shapes },
  { key: "Bayraklar", icon: Flag },
];

interface EmojiPickerProps {
  onEmojiSelected: (emoji: string) => void;
  onClose?: () => void;
}

// Helper function to convert Unicode hex string to emoji
const hexToEmoji = (hex: string): string => {
  // Handle compound emojis with multiple codepoints
  const codepoints = hex.split("-");

  return codepoints
    .map((code) => String.fromCodePoint(parseInt(code, 16)))
    .join("");
};

const cache = getCache();

const saveEmojiUsage = (emoji: string) => {
  try {
    const usage = cache.getEmojiUsage(DEFAULT_EMOJI_USAGE);

    // increase usage count
    usage[emoji] = (usage[emoji] || 0) + 1;

    cache.setEmojiUsage(usage);
  } catch {
    // Ignore errors
  }
};

export function EmojiBoard({
  onEmojiSelected,
  onClose: _onClose,
}: EmojiPickerProps) {
  const [emojiData, setEmojiData] = useState<EmojiCategories>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load emoji data on mount
  useEffect(() => {
    const fetchEmojiData = async () => {
      try {
        const response = await fetch("/emoji-map.json");
        const data = await response.json();
        setEmojiData(data);
      } catch (error) {
        console.error("Failed to load emoji data:", error);
      } finally {
        setLoading(false);
      }
    };

    const emojiMap = cache.getEmojiMap();

    if (emojiMap) {
      setEmojiData(emojiMap);
      setLoading(false);
    } else {
      fetchEmojiData();
    }

    fetchEmojiData();
  }, []);

  // Filter emojis based on search query and selected category
  const filteredEmojis = useMemo(() => {
    if (!emojiData) {
      return {};
    }

    let dataToFilter = emojiData;

    // Filter by category if one is selected
    if (selectedCategory) {
      dataToFilter = { [selectedCategory]: emojiData[selectedCategory] || [] };
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered: EmojiCategories = {};

      Object.entries(dataToFilter).forEach(([category, emojis]) => {
        const matchingEmojis = emojis.filter((emojiItem) =>
          emojiItem.hints.some((hint) => hint.toLowerCase().includes(query)),
        );
        if (matchingEmojis.length > 0) {
          filtered[category] = matchingEmojis;
        }
      });

      return filtered;
    }

    return dataToFilter;
  }, [emojiData, searchQuery, selectedCategory]);

  const handleEmojiClick = (hexCode: string) => {
    const emoji = hexToEmoji(hexCode);
    saveEmojiUsage(emoji);
    onEmojiSelected(emoji);
  };

  const handleCategoryClick = (categoryKey: string) => {
    setSelectedCategory(selectedCategory === categoryKey ? null : categoryKey);
    setSearchQuery(""); // Clear search when switching categories
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
        <Input
          type="text"
          name="search"
          placeholder="Emoji ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {EMOJI_CATEGORIES.map((category) => {
          const IconComponent = category.icon;

          return (
            <Button
              key={category.key}
              variant={
                selectedCategory === category.key ? "outline" : "default"
              }
              size="sm"
              onClick={() => handleCategoryClick(category.key)}
              className="text-xs"
              title={category.key}
            >
              <IconComponent className="h-3 w-3" />
            </Button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <ScrollArea className="h-64">
        <div className="space-y-4">
          {Object.entries(filteredEmojis).map(([categoryName, emojis]) => (
            <div key={categoryName}>
              <h3 className="text-sm font-medium mb-2">{categoryName}</h3>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emojiItem, index) => {
                  const emoji = hexToEmoji(emojiItem.emoji);

                  return (
                    <button
                      key={`${categoryName}-${index}`}
                      onClick={() => handleEmojiClick(emojiItem.emoji)}
                      className="text-2xl hover:scale-110 transition-transform cursor-pointer p-2 rounded hover:bg-gray-100"
                      title={emojiItem.hints.join(", ")}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {Object.keys(filteredEmojis).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No emojis found matching your search.
        </div>
      )}
    </div>
  );
}
