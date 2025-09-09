import { AlertCircle, Loader2, Plus, Trash2, Edit, Save, X, RefreshCw, Undo2 } from "lucide-react";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UpdateTagsPayload } from "@/types/admin";

import { useTags } from "@/hooks/useTags";

interface TagItem {
  tag: string;
  label: string;
}

interface AdminTagsProps {
  performAction: (data: UpdateTagsPayload) => Promise<any>;
}

export default function AdminTags({ performAction }: AdminTagsProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Form state for adding/editing tags
  const [newTag, setNewTag] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editTag, setEditTag] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [localTags, setLocalTags] = useState<TagItem[]>([]);
  const { tags, tagsLastTimeUpdated, loading, error: tagsError, refreshTags } = useTags();

  // Initialize local tags when tags are loaded
  React.useEffect(() => {
    if (tags.length > 0 && localTags.length === 0) {
      setLocalTags(tags);
    }
  }, [tags, localTags.length]);

  const handleSaveTags = async () => {
    try {
      setSaving(true);
      setSuccess("");

      await performAction({
        action: "update-tags",
        tags: localTags,
        lastUpdated: tagsLastTimeUpdated,
      });

      setSuccess("Etiketler başarıyla güncellendi!");

      // Refresh tags from Nostr after successful update
      await refreshTags();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Etiketleri kaydetme hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (!newTag.trim() || !newLabel.trim()) {
      setError("Etiket ve etiket adı gereklidir");
      return;
    }

    // Check for duplicate tags
    if (localTags.some((tag) => tag.tag.toLowerCase() === newTag.toLowerCase())) {
      setError("Etiket zaten mevcut");
      return;
    }

    setLocalTags([...localTags, { tag: newTag.trim(), label: newLabel.trim() }]);

    setNewTag("");
    setNewLabel("");
    setError("");
  };

  const handleEditTag = (index: number) => {
    const tag = localTags[index];

    setEditingIndex(index);
    setEditTag(tag.tag);
    setEditLabel(tag.label);
  };

  const handleSaveEdit = () => {
    if (!editTag.trim() || !editLabel.trim()) {
      setError("Etiket ve etiket adı gereklidir");

      return;
    }

    // Check for duplicate tags (excluding current one)
    if (
      localTags.some(
        (tag, idx) => idx !== editingIndex && tag.tag.toLowerCase() === editTag.toLowerCase(),
      )
    ) {
      setError("Etiket zaten mevcut");

      return;
    }

    const updatedTags = [...localTags];
    updatedTags[editingIndex!] = { tag: editTag.trim(), label: editLabel.trim() };

    setLocalTags(updatedTags);
    setEditingIndex(null);
    setEditTag("");
    setEditLabel("");
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditTag("");
    setEditLabel("");
    setError("");
  };

  const handleRemoveTag = (index: number) => {
    setLocalTags(localTags.filter((_, idx) => idx !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: "add" | "edit") => {
    if (e.key === "Enter") {
      if (action === "add") {
        handleAddTag();
      } else {
        handleSaveEdit();
      }
    }
  };

  const handleResetTags = () => {
    setLocalTags(tags);
    setError("");
    setSuccess("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Etiket Yönetimi ({localTags.length})
        </CardTitle>
        <CardDescription>
          Haber, Makale ve Podcast için kullanılabilir etiketleri yönetin
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Add New Tag Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-semibold">Yeni Etiket Ekle</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newTag">Etiket</Label>
              <Input
                id="newTag"
                placeholder="örnek: bitcoin"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "add")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newLabel">Etiket Adı</Label>
              <Input
                id="newLabel"
                placeholder="örnek: Bitcoin"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, "add")}
              />
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleAddTag} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Etiket Ekle
              </Button>
            </div>
          </div>
        </div>

        {/* Tags List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Mevcut Etiketler</h3>
            <div className="flex gap-2">
              <Button onClick={refreshTags} disabled={loading} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Yenile
              </Button>
              <Button onClick={handleResetTags} disabled={loading} variant="outline" size="sm">
                <Undo2 className="h-4 w-4 mr-2" />
                Sıfırla
              </Button>
              <Button
                onClick={handleSaveTags}
                disabled={saving || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Değişiklikleri Kaydet
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Etiketler yükleniyor...</p>
            </div>
          ) : localTags.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Hiç etiket bulunamadı. Yukarıda ilk etiket ekleyin.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {localTags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  {editingIndex === index ? (
                    // Edit mode
                    <div className="flex items-center gap-4 flex-1">
                      <div className="space-y-1">
                        <Label className="text-xs">Etiket</Label>
                        <Input
                          value={editTag}
                          onChange={(e) => setEditTag(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, "edit")}
                          className="w-32"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Etiket Adı</Label>
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyPress={(e) => handleKeyPress(e, "edit")}
                          className="w-40"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Display mode
                    <>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-mono">
                          {tag.tag}
                        </Badge>
                        <span className="font-medium">{tag.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTag(index)}
                          title="Etiket düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveTag(index)}
                          title="Etiket sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
