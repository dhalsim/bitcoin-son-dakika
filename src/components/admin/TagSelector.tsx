import { Check, ChevronDown, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [open, setOpen] = useState(false);

  // Load dynamic tags
  const { tags: dynamicTags, loading: tagsLoading, error: tagsError, refreshTags } = useTags();

  const handleTagsUpdated = () => {
    refreshTags();
  };

  // Get available tags from dynamic tags and sort alphabetically
  const availableTags = dynamicTags.map((t) => t.tag).sort();

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag if already selected
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      // Add tag if not selected
      onTagsChange([...selectedTags, tag]);
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
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="flex-1 justify-between"
                disabled={tagsLoading || !!tagsError || availableTags.length === 0}
              >
                {tagsLoading
                  ? "Etiketler yükleniyor..."
                  : tagsError
                    ? "Etiket sistemi hatası"
                    : availableTags.length === 0
                      ? "Henüz etiket yok"
                      : placeholder}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command>
                <CommandInput placeholder="Etiket ara..." />
                <CommandList>
                  <CommandEmpty>Etiket bulunamadı.</CommandEmpty>
                  <CommandGroup>
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <CommandItem
                          key={tag}
                          value={`${tag} ${getTagLabel(tag)}`}
                          onSelect={() => toggleTag(tag)}
                        >
                          <div className="flex items-center gap-2">
                            {isSelected && <Check className="h-4 w-4 text-green-600" />}
                            <span className={isSelected ? "text-green-600 font-medium" : ""}>
                              {getTagLabel(tag)}
                            </span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

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
