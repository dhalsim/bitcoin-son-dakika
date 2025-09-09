import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTags } from "@/hooks/useTags";

import TagsDialog from "./TagsDialog";

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export default function TagSelector({
  selectedTags,
  onTagsChange,
  label = "Etiketler",
  placeholder = "Etiket ekle",
  className = "",
}: TagSelectorProps) {
  // Load dynamic tags
  const { tags: dynamicTags, loading: tagsLoading, error: tagsError, refreshTags } = useTags();

  const handleTagsUpdated = () => {
    refreshTags();
  };

  // Get available tags from dynamic tags and sort alphabetically
  const availableTags = dynamicTags.map((t) => t.tag).sort();

  // Filter out already selected tags
  const unselectedTags = availableTags.filter((tag) => !selectedTags.includes(tag));

  const addTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag.trim())) {
      onTagsChange([...selectedTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const getTagLabel = (tag: string) => {
    const dynamicTag = dynamicTags.find((t) => t.tag === tag);
    return dynamicTag?.label || tag.charAt(0).toUpperCase() + tag.slice(1);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label className="text-base font-medium">{label}</Label>

      {/* Tag Selection */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select
            onValueChange={addTag}
            disabled={tagsLoading || !!tagsError || availableTags.length === 0}
          >
            <SelectTrigger className="flex-1">
              <SelectValue
                placeholder={
                  tagsLoading
                    ? "Etiketler yükleniyor..."
                    : tagsError
                      ? "Etiket sistemi hatası"
                      : availableTags.length === 0
                        ? "Henüz etiket yok"
                        : placeholder
                }
              />
            </SelectTrigger>
            <SelectContent>
              {unselectedTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {getTagLabel(tag)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Manage Tags Dialog */}
          {!tagsError && <TagsDialog onTagsUpdated={handleTagsUpdated} />}
        </div>

        {/* Error message */}
        {tagsError && (
          <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md border border-red-200">
            <div className="font-medium mb-1">Etiket Sistemi Hatası</div>
            <div className="mb-2">{tagsError}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshTags}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Tekrar Dene
            </Button>
          </div>
        )}

        {/* No tags available message */}
        {!tagsLoading && !tagsError && availableTags.length === 0 && (
          <div className="text-sm text-muted-foreground">
            Henüz hiç etiket yok. İlk etiketi eklemek için yukarıdaki alanı kullanın.
          </div>
        )}

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {getTagLabel(tag)}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-red-500"
                  title="Etiketi kaldır"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
