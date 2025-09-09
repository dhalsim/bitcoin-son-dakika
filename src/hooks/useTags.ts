import { useState, useEffect } from "react";

import { getTagsEvent, type TagItem } from "../../api-helpers/utils";

interface UseTagsResult {
  tags: TagItem[];
  tagsLastTimeUpdated: number;
  loading: boolean;
  error: string | null;
  refreshTags: () => Promise<void>;
}

export function useTags(): UseTagsResult {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [tagsLastTimeUpdated, setTagsLastTimeUpdated] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTags = async () => {
    try {
      setLoading(true);
      setError(null);

      const event = await getTagsEvent();

      if (event) {
        const tags = event.tags
          .filter((tag) => tag[0] === "t")
          .map((tag) => ({
            tag: tag[1],
            label: tag[2],
          }));

        setTags(tags);
        setTagsLastTimeUpdated(event.created_at);
      } else {
        // No tags event found, treat as error
        throw new Error("Etiket sistemi hatası.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTags();
  }, []);

  return {
    tags,
    tagsLastTimeUpdated,
    loading,
    error,
    refreshTags,
  };
}
