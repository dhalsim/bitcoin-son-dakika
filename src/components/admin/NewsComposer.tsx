import { Loader2, Rocket, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

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

type PrefillData = {
  title?: string;
  summary?: string;
  image?: string;
  url?: string;
  content?: string;
  tags?: string[];
  from?: "sources" | string;
};

type NewsComposerProps = {
  performAction: (data: any) => Promise<any>;
  prefill?: PrefillData;
  prefillToken?: string;
};

export default function NewsComposer({ performAction, prefill, prefillToken }: NewsComposerProps) {
  const [newsContent, setNewsContent] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsTags, setNewsTags] = useState<string[]>([]);
  const [newsPublishLoading, setNewsPublishLoading] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [enTitle, setEnTitle] = useState("");
  const [enSummary, setEnSummary] = useState("");
  const [enContent, setEnContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Apply prefill whenever token changes
  useEffect(() => {
    if (!prefill) return;
    if (typeof prefill.title === "string") setNewsTitle(prefill.title);
    if (typeof prefill.summary === "string") setNewsSummary(prefill.summary);
    if (typeof prefill.image === "string") setNewsImageUrl(prefill.image);
    if (typeof prefill.url === "string") setSourceUrl(prefill.url);
    if (typeof prefill.content === "string") setNewsContent(prefill.content);
    if (Array.isArray(prefill.tags)) setNewsTags(prefill.tags);
    if (typeof prefill.title === "string") setEnTitle(prefill.title);
    if (typeof prefill.summary === "string") setEnSummary(prefill.summary);
    if (typeof prefill.content === "string") setEnContent(prefill.content);
  }, [prefillToken]);

  const isFromSources = prefill?.from === "sources";

  const autoTranslate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;

      const authHeader = await createNIP98Auth("POST", url);

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

      if (tTitle) setNewsTitle(tTitle);
      if (tSummary) setNewsSummary(tSummary);
      if (tContent) setNewsContent(tContent);
    } catch {
      setError("Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !newsTags.includes(tag.trim())) {
      setNewsTags([...newsTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewsTags(newsTags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bitcoinsondakika olarak Haber Gir</CardTitle>
        <CardDescription>Yeni bir haber içeriği oluştur ve doğrudan yayınla</CardDescription>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500">{error}</div>}

        {isFromSources ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: English/originals */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-medium">Original URL</Label>
                {sourceUrl && (
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Aç
                  </a>
                )}
              </div>
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
                <Input value={newsImageUrl} onChange={(e) => setNewsImageUrl(e.target.value)} />
                {newsImageUrl ? (
                  <img src={newsImageUrl} alt="preview" className="mt-2 max-h-48 rounded" />
                ) : null}
              </div>
              <div>
                <Label className="text-base font-medium">English Content</Label>
                <Textarea
                  placeholder="Paste original content here..."
                  value={enContent}
                  onChange={(e) => setEnContent(e.target.value)}
                  className="min-h-[240px]"
                />
              </div>
            </div>

            {/* Right: Turkish editable */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Başlık (TR) *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={autoTranslate}
                  disabled={isLoading}
                >
                  {isLoading ? "Çeviriyor..." : "Oto Çevir"}
                </Button>
              </div>
              <Input
                placeholder="Haber başlığı"
                value={newsTitle}
                onChange={(e) => setNewsTitle(e.target.value)}
                disabled={isLoading}
              />

              <div>
                <Label className="text-base font-medium">Özet (TR)</Label>
                <Textarea
                  placeholder="Haberin kısa özeti..."
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>

              <div>
                <Label className="text-base font-medium">İçerik (TR) *</Label>
                <Textarea
                  placeholder="Haberinizin içeriğini buraya yazın..."
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
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
                      {CATEGORY_OPTIONS.filter((tag) => !newsTags.includes(tag)).map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {newsTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newsTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Publish */}
              <div className="pt-2">
                <Button
                  onClick={async () => {
                    if (!newsContent.trim() || !newsTitle.trim()) {
                      return;
                    }

                    try {
                      setNewsPublishLoading(true);

                      const payload: any = {
                        action: "publish-news",
                        content: newsContent.trim(),
                        title: newsTitle.trim(),
                        tags: newsTags,
                      };

                      if (newsSummary.trim()) {
                        payload.summary = newsSummary.trim();
                      }

                      if (newsImageUrl.trim() || prefill?.image) {
                        payload.image = (newsImageUrl || prefill?.image || "").trim();
                      }

                      await performAction(payload);
                    } finally {
                      setNewsPublishLoading(false);
                    }
                  }}
                  disabled={newsPublishLoading || !newsContent.trim() || !newsTitle.trim()}
                  className="w-full"
                  size="lg"
                >
                  {newsPublishLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Yayınlanıyor...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Haberi Yayınla
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Single column composer
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="newsTitle" className="text-base font-medium">
                  Başlık *
                </Label>
                <Input
                  id="newsTitle"
                  placeholder="Haber başlığı"
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="newsSummary" className="text-base font-medium">
                  Özet (İsteğe bağlı)
                </Label>
                <Textarea
                  id="newsSummary"
                  placeholder="Haberin kısa özeti..."
                  value={newsSummary}
                  onChange={(e) => setNewsSummary(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="newsContent" className="text-base font-medium">
                  Haber İçeriği *
                </Label>
                <Textarea
                  id="newsContent"
                  placeholder="Haberinizin içeriğini buraya yazın..."
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  className="min-h-[300px]"
                />
              </div>

              <div>
                <Label className="text-base font-medium">Görsel</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Görsel URL'si"
                    value={newsImageUrl}
                    onChange={(e) => setNewsImageUrl(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Etiketler</Label>
                <div className="space-y-2">
                  <Select onValueChange={addTag}>
                    <SelectTrigger>
                      <SelectValue placeholder="Etiket ekle" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.filter((tag) => !newsTags.includes(tag)).map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {newsTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newsTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={async () => {
                    if (!newsContent.trim() || !newsTitle.trim()) {
                      return;
                    }

                    try {
                      setNewsPublishLoading(true);

                      const payload: any = {
                        action: "publish-news",
                        content: newsContent.trim(),
                        title: newsTitle.trim(),
                        tags: newsTags,
                      };

                      if (newsSummary.trim()) {
                        payload.summary = newsSummary.trim();
                      }

                      if (newsImageUrl.trim()) {
                        payload.image = newsImageUrl.trim();
                      }

                      await performAction(payload);
                    } finally {
                      setNewsPublishLoading(false);
                    }
                  }}
                  disabled={newsPublishLoading || !newsContent.trim() || !newsTitle.trim()}
                  className="w-full"
                  size="lg"
                >
                  {newsPublishLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Yayınlanıyor...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Haberi Yayınla
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
