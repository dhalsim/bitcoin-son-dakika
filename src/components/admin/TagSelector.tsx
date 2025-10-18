import { Check, ChevronDown, X, AlertTriangle } from "lucide-react";
import { useState, useEffect, useMemo, useRef } from "react";

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
  // Required prop for validation state
  onValidationChange: (isValid: boolean, invalidTags: string[]) => void;
}

export default function TagSelector({
  selectedTags,
  onTagsChange,
  label = "Etiketler",
  placeholder = "Etiket ekle",
  className = "",
  onValidationChange, // Required prop
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);

  // Load dynamic tags
  const { tags: dynamicTags, loading: tagsLoading, error: tagsError, refreshTags } = useTags();

  const handleTagsUpdated = () => {
    refreshTags();
  };

  // Get available tags from dynamic tags and sort alphabetically
  const availableTags = useMemo(() => dynamicTags.map((t) => t.tag).sort(), [dynamicTags]);

  // Tag validation logic
  const validationResult = useMemo(() => {
    const invalidTags = selectedTags.filter((tag) => !availableTags.includes(tag));
    const validTags = selectedTags.filter((tag) => availableTags.includes(tag));

    return {
      isValid: invalidTags.length === 0,
      invalidTags,
      validTags,
    };
  }, [selectedTags, availableTags]);

  // Notify parent of validation changes
  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;

  useEffect(() => {
    onValidationChangeRef.current(validationResult.isValid, validationResult.invalidTags);
  }, [validationResult.isValid, validationResult.invalidTags]);

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

  const isTagInvalid = (tag: string) => validationResult.invalidTags.includes(tag);

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

        {/* Invalid tags warning */}
        {validationResult.invalidTags.length > 0 && (
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
            <div className="font-medium mb-1 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              Geçersiz Etiketler
            </div>
            <div className="mb-2">
              Aşağıdaki etiketler henüz sisteme eklenmemiş:{" "}
              {validationResult.invalidTags.join(", ")}
            </div>
            <div className="text-xs text-amber-700">
              Bu etiketleri kaldırın veya önce sisteme ekleyin.
            </div>
          </div>
        )}

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <Badge
                key={tag}
                variant={isTagInvalid(tag) ? "destructive" : "secondary"}
                className={`flex items-center gap-1 ${
                  isTagInvalid(tag) ? "bg-error text-error-foreground border-error" : ""
                }`}
              >
                {isTagInvalid(tag) && <AlertTriangle className="h-3 w-3" />}
                {getTagLabel(tag)}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-error"
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
