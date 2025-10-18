import { Loader2, Rocket, CheckCircle } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ArticleMarkdownRenderer from "@/components/ArticleMarkdownRenderer";
import { MediaUrlInput } from "@/components/common/MediaUrlInput";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { useBlossomUpload, UploadOptions, UploadResult } from "@/hooks/useBlossomUpload";
import { WEBSITE_URL } from "@/lib/constants";
import type { ArticleItem } from "@/lib/ssg-data";

import { createNIP98Auth } from "./utils";
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
  blossomServers: string[];
};

export default function ArticleComposer({
  performPublishAction,
  editData,
  onCancelEdit,
  blossomServers = [],
}: ArticleComposerProps) {
  const [title, setTitle] = useState(editData?.title || "");
  const [summary, setSummary] = useState(editData?.summary || "");
  const [imageUrl, setImageUrl] = useState(editData?.image || "");
  const [content, setContent] = useState(editData?.content || "");
  const [tags, setTags] = useState<string[]>(editData?.tagItems.map((tag) => tag.tag) || []);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [tagsValid, setTagsValid] = useState(true);
  const [invalidTags, setInvalidTags] = useState<string[]>([]);
  const { getPublicKey, signEvent } = useNostrAuth();
  const { uploadToBlossom, uploadUrlToBlossom } = useBlossomUpload();

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

  const handleTagsValidationChange = useCallback((isValid: boolean, invalidTagsList: string[]) => {
    setTagsValid(isValid);
    setInvalidTags(invalidTagsList);
  }, []);

  const canPublish = title.trim() && content.trim() && tagsValid;

  const handleImageUpload = async (
    file: File,
    servers: string[],
    options: UploadOptions,
  ): Promise<UploadResult> => {
    const url = `${WEBSITE_URL}/api/admin-panel`;
    const authToken = await createNIP98Auth("POST", url, getPublicKey, signEvent);

    return uploadToBlossom(file, servers, options, authToken);
  };

  const handleImageUrlUpload = async (
    url: string,
    servers: string[],
    options: UploadOptions,
  ): Promise<UploadResult> => {
    const apiUrl = `${WEBSITE_URL}/api/admin-panel`;
    const authToken = await createNIP98Auth("POST", apiUrl, getPublicKey, signEvent);

    return uploadUrlToBlossom(url, servers, options, authToken);
  };

  const handleImageChange = (url: string) => {
    setImageUrl(url);
    setUploadSuccess(true);
    // Hide success indicator after 3 seconds
    setTimeout(() => setUploadSuccess(false), 3000);
  };

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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Resim URL</Label>
                {uploadSuccess && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm">Yükleme başarılı!</span>
                  </div>
                )}
              </div>
            </div>
            <MediaUrlInput
              value={imageUrl}
              onChange={handleImageChange}
              onlyImage={true}
              label=""
              placeholder="Resim URL'si girin veya dosya yükleyin"
              blossomServers={blossomServers}
              onUploadToBlossom={handleImageUpload}
              onUploadUrlToBlossom={handleImageUrlUpload}
            />
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
            onValidationChange={handleTagsValidationChange}
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
            {!tagsValid && (
              <div className="text-sm text-error bg-error/10 p-2 rounded-md border border-error/20 mb-3">
                Yayınlamadan önce geçersiz etiketleri düzeltin: {invalidTags.join(", ")}
              </div>
            )}
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
