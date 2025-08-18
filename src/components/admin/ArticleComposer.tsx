import { Loader2, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNIP98Auth } from "./utils";
import ArticleMarkdownRenderer from "@/components/ui/ArticleMarkdownRenderer";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

const CATEGORY_OPTIONS = [
  "bitcoin",
  "nostr",
  "analiz",
  "piyasa",
  "teknoloji",
  "ekonomi",
  "regülasyon",
  "mining",
  "defi",
  "nft",
  "ethereum",
  "altcoin",
  "güvenlik",
  "eğitim",
  "haber",
  "geliştirme",
];

type ArticleComposerProps = {
  performAction: (data: any) => Promise<any>;
};

export default function ArticleComposer({ performAction }: ArticleComposerProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [enTitle, setEnTitle] = useState("");
  const [enSummary, setEnSummary] = useState("");
  const [enContent, setEnContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { getPublicKey, signEvent } = useNostrAuth();

  const preview = useMemo(() => content, [content]);

  const addTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const autoTranslate = async () => {
    setIsTranslating(true);
    setError(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;
      const authHeader = await createNIP98Auth("POST", url, getPublicKey, signEvent);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          action: "translate-news",
          textToTranslate: [enTitle || "", enSummary || "", enContent || ""],
          targetLanguageCode: "tr",
        }),
      });

      const json = await response.json();
      const translations = json?.translations?.translations || json?.translations || [];
      const [tTitle, tSummary, tContent] = translations.map((t: any) => t?.translatedText || "");

      if (tTitle) setTitle(tTitle);
      if (tSummary) setSummary(tSummary);
      if (tContent) setContent(tContent);
    } catch (e) {
      setError("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsTranslating(false);
    }
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: English/originals */}
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">English Title</Label>
              <Input value={enTitle} onChange={(e) => setEnTitle(e.target.value)} />
            </div>
            <div>
              <Label className="text-base font-medium">English Summary</Label>
              <Textarea
                value={enSummary}
                onChange={(e) => setEnSummary(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div>
              <Label className="text-base font-medium">Image URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              {imageUrl ? (
                <img src={imageUrl} alt="preview" className="mt-2 max-h-48 rounded" />
              ) : null}
            </div>
            <div>
              <Label className="text-base font-medium">English Content (Markdown)</Label>
              <Textarea
                placeholder="Paste original content here..."
                value={enContent}
                onChange={(e) => setEnContent(e.target.value)}
                className="min-h-[240px]"
              />
            </div>
          </div>

          {/* Right: Turkish editable + preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Başlık (TR) *</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={autoTranslate}
                disabled={isTranslating}
              >
                {isTranslating ? "Çeviriyor..." : "Oto Çevir"}
              </Button>
            </div>
            <Input
              placeholder="Makale başlığı"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

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
              <Label className="text-base font-medium">İçerik (Markdown) *</Label>
              <Textarea
                placeholder="Markdown içeriği buraya yazın..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[240px]"
              />
            </div>

            {/* Tags */}
            <div>
              <Label className="text-base font-medium">Etiketler</Label>
              <div className="space-y-2">
                <Select onValueChange={addTag}>
                  <SelectTrigger>
                    <SelectValue placeholder="Etiket ekle" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.filter((tag) => !tags.includes(tag)).map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag.charAt(0).toUpperCase() + tag.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Markdown preview */}
            <div>
              <Label className="text-base font-medium">Önizleme</Label>
              <div className="border rounded-md p-3">
                <ArticleMarkdownRenderer content={preview || "Önizleme yok"} />
              </div>
            </div>

            {/* Publish */}
            <div className="pt-2">
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
                    await performAction(payload);
                  } finally {
                    setIsPublishing(false);
                  }
                }}
                disabled={isPublishing || !canPublish}
                className="w-full"
                size="lg"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Yayınlanıyor...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4 mr-2" />
                    Makaleyi Yayınla
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
