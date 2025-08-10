import { Loader2, Rocket, Upload, X } from "lucide-react";
import { useState } from "react";

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

type NewsComposerProps = {
  performAction: (data: any) => Promise<any>;
};

export default function NewsComposer({ performAction }: NewsComposerProps) {
  const [newsContent, setNewsContent] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [newsTags, setNewsTags] = useState<string[]>([]);
  const [newsPublishLoading, setNewsPublishLoading] = useState(false);

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Content Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="newsContent" className="text-base font-medium">
                Haber İçeriği *
              </Label>
              <Textarea
                id="newsContent"
                placeholder="Haberinizin içeriğini buraya yazın..."
                value={newsContent}
                onChange={(e) => setNewsContent(e.target.value)}
                className="min-h-[300px] resize-none"
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
                        <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Column */}
          <div className="space-y-4">
            {/* Title */}
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

            {/* Summary */}
            <div>
              <Label htmlFor="newsSummary" className="text-base font-medium">
                Özet (İsteğe bağlı)
              </Label>
              <Textarea
                id="newsSummary"
                placeholder="Haberin kısa özeti..."
                value={newsSummary}
                onChange={(e) => setNewsSummary(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>

            {/* Image */}
            <div>
              <Label className="text-base font-medium">Görsel</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Görsel URL'si"
                  value={newsImageUrl}
                  onChange={(e) => setNewsImageUrl(e.target.value)}
                />
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="flex items-center gap-2" disabled>
                    <Upload className="h-4 w-4" />
                    Dosya Yükle
                  </Button>
                  <span className="text-sm text-gray-500">(Yakında eklenecek)</span>
                </div>
              </div>
            </div>

            {/* Publish / Upload Buttons */}
            <div className="pt-4">
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
                    {" "}
                    <Rocket className="h-4 w-4 mr-2" />
                    Haberi Yayınla
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
