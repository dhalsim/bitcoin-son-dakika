import { useState, useMemo, useEffect } from "react";
import { AlertCircle, Loader2, Mic, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ArticleMarkdownRenderer from "@/components/ArticleMarkdownRenderer";
import { ImageUrlInput } from "@/components/common/ImageUrlInput";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { WEBSITE_URL } from "@/lib/constants";
import type { PodcastItem } from "@/lib/ssg-data";
import { PublishPodcastPayload } from "@/types/admin";
import { formatDuration, parseDurationString } from "@/lib/utils";

import { createNIP98Auth } from "./utils";
import TagSelector from "./TagSelector";

type PodcastEditData = Omit<PodcastItem, "author"> & {
  dTag: string;
  pubkey: string;
  relay: string;
};

interface PodcastComposerProps {
  performPublishAction: (data: any) => Promise<void>;
  editData?: PodcastEditData;
  onCancelEdit: () => void;
  blossomServers: string[];
}

export default function PodcastComposer({
  performPublishAction,
  editData,
  onCancelEdit,
  blossomServers = [],
}: PodcastComposerProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(editData?.title || "");
  const [content, setContent] = useState(editData?.content || "");
  const [summary, setSummary] = useState(editData?.summary || "");
  const [image, setImage] = useState(editData?.image || "");
  const [audioUrl, setAudioUrl] = useState(editData?.audioUrl || "");
  const [duration, setDuration] = useState(
    editData?.duration ? formatDuration(editData.duration) : "",
  );
  const [episodeNumber, setEpisodeNumber] = useState<number | null>(
    editData?.episodeNumber || null,
  );
  const [transcriptUrl, setTranscriptUrl] = useState(editData?.transcriptUrl || "");
  const [chaptersUrl, setChaptersUrl] = useState(editData?.chaptersUrl || "");
  const [tags, setTags] = useState<string[]>(
    editData?.tagItems.map((tagItem) => tagItem.tag) || [],
  );
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const { getPublicKey, signEvent } = useNostrAuth();

  const preview = useMemo(() => content, [content]);

  // Reset form when editData changes (only when entering edit mode)
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setContent(editData.content || "");
      setSummary(editData.summary || "");
      setImage(editData.image || "");
      setAudioUrl(editData.audioUrl || "");
      setDuration(editData.duration ? formatDuration(editData.duration) : "");
      setEpisodeNumber(editData.episodeNumber);
      setTranscriptUrl(editData.transcriptUrl || "");
      setChaptersUrl(editData.chaptersUrl || "");
      setTags(editData.tagItems.map((tagItem) => tagItem.tag) || []);
    } else {
      // Clear form when not in edit mode
      setTitle("");
      setContent("");
      setSummary("");
      setImage("");
      setAudioUrl("");
      setDuration("");
      setEpisodeNumber(null);
      setTranscriptUrl("");
      setChaptersUrl("");
      setTags([]);
    }
  }, [editData]);

  const handleTagsChange = (newTags: string[]) => {
    setTags(newTags);
  };

  const handleImageUpload = async (
    file: File,
    servers: string[],
    options: {
      optimize: boolean;
      generateBlurHash: boolean;
      format: "webp" | "avif" | "jpeg";
      quality: number;
      maxWidth: number | null;
    },
  ) => {
    const url = `${WEBSITE_URL}/api/admin-panel`;
    const authToken = await createNIP98Auth("POST", url, getPublicKey, signEvent);

    const formData = new FormData();
    formData.append("action", "upload-blossom-media");
    formData.append("file", file);
    formData.append("servers", servers.join(","));
    formData.append("optimize", options.optimize.toString());
    formData.append("generateBlurHash", options.generateBlurHash.toString());
    formData.append("format", options.format);
    formData.append("quality", options.quality.toString());
    if (options.maxWidth) {
      formData.append("maxWidth", options.maxWidth.toString());
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: authToken,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    return result.data;
  };

  const handleImageUrlUpload = async (
    url: string,
    servers: string[],
    options: {
      optimize: boolean;
      generateBlurHash: boolean;
      format: "webp" | "avif" | "jpeg";
      quality: number;
      maxWidth: number | null;
    },
  ) => {
    const apiUrl = `${WEBSITE_URL}/api/admin-panel`;
    const authToken = await createNIP98Auth("POST", apiUrl, getPublicKey, signEvent);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authToken,
      },
      body: JSON.stringify({
        action: "upload-file-url",
        url,
        servers,
        optimize: options.optimize,
        generateBlurHash: options.generateBlurHash,
        format: options.format,
        quality: options.quality,
        maxWidth: options.maxWidth,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(errorData.error || `Upload failed: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    return result.data;
  };

  const handleImageChange = (url: string) => {
    setImage(url);
    setUploadSuccess(true);
    // Hide success indicator after 3 seconds
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: PublishPodcastPayload = {
        action: "publish-podcast",
        title,
        content,
        summary,
        image,
        audioUrl,
        duration: duration ? parseDurationString(duration) : 0,
        episodeNumber,
        transcriptUrl,
        chaptersUrl,
        tags: tags,
      };

      // If editing, include the original dTag to update the existing podcast
      if (editData?.dTag) {
        payload.dTag = editData.dTag;
      }

      await performPublishAction(payload);

      // Clear edit mode after successful publish
      if (editData) {
        onCancelEdit();
      }
      // Form will be cleared by useEffect when editData becomes null
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Podcast Yayınla</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Yeni bir podcast bölümü oluşturun ve yayınlayın.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Podcast Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Podcast bölüm başlığı"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="episodeNumber">Bölüm Numarası</Label>
                <Input
                  id="episodeNumber"
                  type="number"
                  value={episodeNumber}
                  onChange={(e) => setEpisodeNumber(Number(e.target.value))}
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Özet</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Podcast bölümünün kısa özeti"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">İçerik (Markdown) *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Podcast bölümünün detaylı açıklaması (Markdown formatında)"
                rows={6}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Markdown formatı desteklenir. Başlık için #, kalın için **metin**, italik için
                *metin* kullanın.
              </p>
            </div>

            {/* Markdown preview */}
            {content && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Önizleme</Label>
                <div className="border rounded-md p-3">
                  <ArticleMarkdownRenderer content={preview || "Önizleme yok"} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Label htmlFor="image">Görsel URL</Label>
                  {uploadSuccess && (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Yükleme başarılı!</span>
                    </div>
                  )}
                </div>
                <ImageUrlInput
                  value={image}
                  onChange={handleImageChange}
                  label=""
                  placeholder="Görsel URL'si girin veya dosya yükleyin"
                  blossomServers={blossomServers}
                  onUploadToBlossom={handleImageUpload}
                  onUploadUrlToBlossom={handleImageUrlUpload}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audioUrl">Ses Dosyası URL *</Label>
                <Input
                  id="audioUrl"
                  value={audioUrl}
                  onChange={(e) => setAudioUrl(e.target.value)}
                  placeholder="https://example.com/audio.mp3"
                  type="url"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Süre</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1:23:45"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="transcriptUrl">Transcript URL</Label>
                <Input
                  id="transcriptUrl"
                  value={transcriptUrl}
                  onChange={(e) => setTranscriptUrl(e.target.value)}
                  placeholder="https://example.com/transcript.vtt"
                  type="url"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="chaptersUrl">Chapters URL</Label>
                <Input
                  id="chaptersUrl"
                  value={chaptersUrl}
                  onChange={(e) => setChaptersUrl(e.target.value)}
                  placeholder="https://example.com/chapters.json"
                  type="url"
                />
              </div>
            </div>

            <TagSelector
              selectedTags={tags}
              onTagsChange={handleTagsChange}
              label="Etiketler"
              placeholder="Etiket ekle"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <div className="flex gap-2">
            {editData && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                İptal
              </Button>
            )}
            <Button type="submit" disabled={loading || !title || !content || !audioUrl}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editData ? "Güncelleniyor..." : "Yayınlanıyor..."}
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 mr-2" />
                  {editData ? "Podcast'i Güncelle" : "Podcast Yayınla"}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Podcast yayınlandıktan sonra, yayınlanan içerik otomatik olarak podcast listesine eklenir.
          Yayın işlemi tamamlandıktan sonra deploy etmeyi unutmayın.
        </AlertDescription>
      </Alert>
    </div>
  );
}
