import { Loader2, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ArticleMarkdownRenderer from "@/components/ArticleMarkdownRenderer";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import type { ArticleItem } from "@/lib/ssg-data";

import TagSelector from "./TagSelector";

type ArticleEditData = Omit<ArticleItem, "author"> & {
  dTag: string;
  pubkey: string;
  relay: string;
};

type ArticleComposerProps = {
  performPublishAction: (data: any) => Promise<any>;
  editData?: ArticleEditData;
  onCancelEdit: () => void;
};

export default function ArticleComposer({
  performPublishAction,
  editData,
  onCancelEdit,
}: ArticleComposerProps) {
  const [title, setTitle] = useState(editData?.title || "");
  const [summary, setSummary] = useState(editData?.summary || "");
  const [imageUrl, setImageUrl] = useState(editData?.image || "");
  const [content, setContent] = useState(editData?.content || "");
  const [tags, setTags] = useState<string[]>(editData?.tagItems.map((tag) => tag.tag) || []);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getPublicKey, signEvent } = useNostrAuth();

  const preview = useMemo(() => content, [content]);

  // Reset form when editData changes
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setSummary(editData.summary || "");
      setImageUrl(editData.image || "");
      setContent(editData.content || "");
      setTags(editData.tagItems.map((tag) => tag.tag) || []);
    }
  }, [editData]);

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  const canPublish = title.trim() && content.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Makale Yayınla</CardTitle>
        <CardDescription>Markdown destekli uzun makale oluştur ve yayınla</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500">{error}</div>}

        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Başlık (TR) *</Label>
            <Input
              placeholder="Makale başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label className="text-base font-medium">Özet (TR)</Label>
            <Textarea
              placeholder="Makaleye kısa bir özet..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div>
            <Label className="text-base font-medium">Resim URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            {imageUrl ? (
              <img src={imageUrl} alt="preview" className="mt-2 max-h-48 rounded" />
            ) : null}
          </div>

          <div>
            <Label className="text-base font-medium">İçerik (Markdown) *</Label>
            <Textarea
              placeholder="Markdown içeriği buraya yazın..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[240px]"
            />
          </div>

          {/* Tags */}
          <TagSelector
            selectedTags={tags}
            onTagsChange={handleTagsChange}
            label="Etiketler"
            placeholder="Etiket ekle"
          />

          {/* Markdown preview */}
          <div>
            <Label className="text-base font-medium">Önizleme</Label>
            <div className="border rounded-md p-3">
              <ArticleMarkdownRenderer content={preview || "Önizleme yok"} />
            </div>
          </div>

          {/* Publish */}
          <div className="pt-2">
            <div className="flex gap-2">
              {editData && (
                <Button onClick={onCancelEdit} variant="outline" className="flex-1" size="lg">
                  İptal
                </Button>
              )}
              <Button
                onClick={async () => {
                  if (!canPublish) return;
                  try {
                    setIsPublishing(true);
                    const payload: any = {
                      action: "publish-article",
                      content: content.trim(),
                      title: title.trim(),
                      tags,
                    };
                    if (summary.trim()) payload.summary = summary.trim();
                    if (imageUrl.trim()) payload.image = imageUrl.trim();

                    // If editing, include the original dTag to update the existing article
                    if (editData?.dTag) {
                      payload.dTag = editData.dTag;
                    }

                    await performPublishAction(payload);

                    // Clear edit mode after successful publish
                    if (editData) {
                      onCancelEdit();
                    }
                  } finally {
                    setIsPublishing(false);
                  }
                }}
                disabled={isPublishing || !canPublish}
                className={editData ? "flex-1" : "w-full"}
                size="lg"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editData ? "Güncelleniyor..." : "Yayınlanıyor..."}
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    {editData ? "Makaleyi Güncelle" : "Makaleyi Yayınla"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
