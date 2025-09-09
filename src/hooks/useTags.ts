import { useState, useEffect } from "react";

import { getOneKind30023Event } from "@/lib/nip23";

import { ADMIN_RELAYS, MASTER_ADMIN_PUBKEY, type TagItem } from "../../api-helpers/utils";

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

      const event = await getOneKind30023Event(
        Array.from(ADMIN_RELAYS),
        MASTER_ADMIN_PUBKEY,
        "tags",
      );

      if (event) {
        const tags = event.tags
          .filter((tag) => tag[0] === "t")
          .map((tag) => ({
            tag: tag[1],
            label: tag[2],
          }));

        setTags(tags);
        setTagsLastTimeUpdated(event.created_at);
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
