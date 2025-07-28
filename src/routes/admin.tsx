import {
  Shield,
  Key,
  AlertCircle,
  Loader2,
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Plus,
  FileText,
  Rocket,
  X,
  Upload,
} from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { pool } from "@/lib/utils";

import {
  ADMIN_RELAYS,
  PROFILE_RELAYS,
  type PublishEventResponse,
} from "../../api-helpers/utils";

type AddArticlePayload =
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; a: string; relay: string };

type AddNewsPayload = {
  action: "add-news";
  eventId: string;
  relay: string;
};

type RemoveNewsPayload = {
  action: "remove-news";
  eventId: string;
  relay: string;
};

type RemoveArticlePayload = {
  action: "remove-article";
  aTag: string;
  relay: string;
};

type AddAdminPayload = {
  action: "add-admin-pubkey";
  pubkey: string;
};

type RemoveAdminPayload = {
  action: "remove-admin-pubkey";
  pubkey: string;
};

type RemoveEditorPayload = {
  action: "remove-editor-pubkey";
  pubkey: string;
};

type AddEditorPayload = {
  action: "add-editor-pubkey";
  pubkey: string;
};

type PublishNewsPayload = {
  action: "publish-news";
  content: string;
  title: string;
  category: string;
  summary?: string;
  image?: string;
  tags: string[];
};

type Payload =
  | AddNewsPayload
  | RemoveNewsPayload
  | AddArticlePayload
  | RemoveArticlePayload
  | AddAdminPayload
  | RemoveAdminPayload
  | RemoveEditorPayload
  | AddEditorPayload
  | PublishNewsPayload;

const MASTER_ADMIN_PUBKEY =
  "5fb571abb0a02ff241fc6090437ef1516157c66e03918ac519befea6475b72df";

interface AdminData {
  adminUsers: string[];
  editorUsers: string[];
  news: { eTag: string; relay: string }[];
  articles: { aTag: string; relay: string }[];
}

interface UserInfo {
  pubkey?: string;
  roles?: string[];
}

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

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string>("");
  const [deployLoading, setDeployLoading] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);

  // Form states
  const [newAdminPubkey, setNewAdminPubkey] = useState("");
  const [newEditorPubkey, setNewEditorPubkey] = useState("");

  // News form states
  const [newsEventId, setNewsEventId] = useState("");
  const [newsRelay, setNewsRelay] = useState("");

  // Article form states
  const [articleInputMethod, setArticleInputMethod] = useState<
    "naddr" | "fields"
  >("naddr");
  const [articleNaddr, setArticleNaddr] = useState("");
  const [articlePubkey, setArticlePubkey] = useState("");
  const [articleDTag, setArticleDTag] = useState("");
  const [articleRelay, setArticleRelay] = useState("");

  const [publishSuccess, setPublishSuccess] =
    useState<PublishEventResponse | null>(null);

  // News creation form states
  const [newsContent, setNewsContent] = useState("");
  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsImageUrl, setNewsImageUrl] = useState("");
  const [_newsImageFile, setNewsImageFile] = useState<File | null>(null);
  const [newsTags, setNewsTags] = useState<string[]>([]);
  const [newsCategory, setNewsCategory] = useState("");
  const [newsPublishLoading, setNewsPublishLoading] = useState(false);

  useEffect(() => {
    loadAdminData();
    checkUserInfo();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);

    try {
      const events: NostrEvent[] = [];

      pool.subscribeManyEose(
        ADMIN_RELAYS,
        [
          {
            authors: [MASTER_ADMIN_PUBKEY],
            kinds: [30000],
            "#d": ["admin-users"],
            limit: 1,
          },
          {
            authors: [MASTER_ADMIN_PUBKEY],
            kinds: [30000],
            "#d": ["editor-users"],
            limit: 1,
          },
          {
            authors: [MASTER_ADMIN_PUBKEY],
            kinds: [30004],
            "#d": ["news"],
            limit: 1,
          },
          {
            authors: [MASTER_ADMIN_PUBKEY],
            kinds: [30004],
            "#d": ["articles"],
            limit: 1,
          },
        ],
        {
          onevent(evt) {
            console.log(evt);

            events.push(evt);
          },
          onclose() {
            let adminUsers: string[] = [];
            let editorUsers: string[] = [];
            let news: { eTag: string; relay: string }[] = [];
            let articles: { aTag: string; relay: string }[] = [];

            // Parse the events to extract pubkeys from sets
            events.forEach((event) => {
              const dTag = event.tags.find((tag) => tag[0] === "d")?.[1];

              if (dTag === "admin-users") {
                // Extract pubkeys from 'p' tags
                adminUsers = event.tags
                  .filter((tag) => tag[0] === "p")
                  .map((tag) => tag[1])
                  .filter(Boolean);
              } else if (dTag === "editor-users") {
                // Extract pubkeys from 'p' tags
                editorUsers = event.tags
                  .filter((tag) => tag[0] === "p")
                  .map((tag) => tag[1])
                  .filter(Boolean);
              } else if (dTag === "news") {
                // News uses 'e' tags for event IDs with relay
                news = event.tags
                  .filter((tag) => tag[0] === "e")
                  .map((tag) => ({
                    eTag: tag[1],
                    relay: tag[2],
                  }))
                  .filter((item) => item.eTag);
              } else if (dTag === "articles") {
                // Articles use 'a' tags for addressable events with relay
                articles = event.tags
                  .filter((tag) => tag[0] === "a")
                  .map((tag) => ({
                    aTag: tag[1],
                    relay: tag[2] || "wss://relay.damus.io",
                  }))
                  .filter((item) => item.aTag);
              }
            });

            setAdminData({
              adminUsers,
              editorUsers,
              news,
              articles,
            });

            setLoading(false);
          },
        },
      );
    } catch (err) {
      console.error("Error loading admin data from Nostr:", err);
      setError("Nostr verilerini yüklerken hata oluştu");
    }
  };

  const checkUserInfo = async () => {
    try {
      if (!window.nostr) {
        return;
      }

      const pubkey = await window.nostr.getPublicKey();

      const roles = [
        adminData?.adminUsers.includes(pubkey) ? "admin" : null,
        adminData?.editorUsers.includes(pubkey) ? "editor" : null,
      ].filter(Boolean);

      setUserInfo({ pubkey, roles });
    } catch {
      console.log("Nostr extension not available or user declined");
    }
  };

  const createNIP98Auth = async (method: string, url: string) => {
    if (!window.nostr || !userInfo.pubkey) {
      throw new Error("Nostr uzantısı gerekli");
    }

    const authEvent = {
      kind: 27235,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["u", url],
        ["method", method],
      ],
      content: "",
      pubkey: userInfo.pubkey,
    };

    const signedEvent = await window.nostr.signEvent(authEvent);

    return `Nostr ${btoa(JSON.stringify(signedEvent))}`;
  };

  const performAction = async (data: Payload) => {
    setActionLoading(data.action);
    setError("");
    setPublishSuccess(null);

    try {
      const url = "https://www.bitcoinsondakika.com/api/admin";
      const authHeader = await createNIP98Auth("POST", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        await loadAdminData();
        setPublishSuccess(result);
      } else {
        setError(result.error || "İşlem başarısız");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setActionLoading("");
    }
  };

  const addAdmin = () => {
    if (!newAdminPubkey.trim()) {
      return;
    }

    performAction({
      action: "add-admin-pubkey",
      pubkey: newAdminPubkey.trim(),
    });
  };

  const removeAdmin = (pubkey: string) => {
    performAction({ action: "remove-admin-pubkey", pubkey });
  };

  const addEditor = () => {
    if (!newEditorPubkey.trim()) {
      return;
    }

    performAction({
      action: "add-editor-pubkey",
      pubkey: newEditorPubkey.trim(),
    });
  };

  const removeEditor = (pubkey: string) => {
    performAction({ action: "remove-editor-pubkey", pubkey });
  };

  const addNews = () => {
    if (!newsEventId.trim() || !newsRelay.trim()) {
      return;
    }

    performAction({
      action: "add-news",
      eventId: newsEventId.trim(),
      relay: newsRelay.trim(),
    });
  };

  const addArticle = async () => {
    if (articleInputMethod === "naddr") {
      if (!articleNaddr.trim()) {
        setError("NAddr gerekli");

        return;
      }

      await performAction({
        action: "add-article",
        type: "naddr",
        naddr: articleNaddr.trim(),
      });
    } else {
      if (
        !articlePubkey.trim() ||
        !articleDTag.trim() ||
        !articleRelay.trim()
      ) {
        setError("Yazar Pubkey, D Tag ve Relay gerekli");

        return;
      }

      const aTag = `30023:${articlePubkey.trim()}:${articleDTag.trim()}`;
      await performAction({
        action: "add-article",
        type: "a",
        a: aTag,
        relay: articleRelay.trim(),
      });
    }

    // Clear form
    setArticleNaddr("");
    setArticlePubkey("");
    setArticleDTag("");
    setArticleRelay("");
  };

  const removeNews = (eventId: string, relay: string) => {
    performAction({
      action: "remove-news",
      eventId,
      relay,
    });
  };

  const removeArticle = (aTag: string, relay: string) => {
    performAction({
      action: "remove-article",
      aTag,
      relay,
    });
  };

  const triggerDeploy = async () => {
    setDeployLoading(true);
    setError("");
    setDeploySuccess(false);

    try {
      const authHeader = await createNIP98Auth(
        "POST",
        `${window.location.origin}/api/admin/trigger-deploy`,
      );

      const response = await fetch("/api/admin", {
        method: "POST",
        body: JSON.stringify({
          action: "trigger-deploy",
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
      });

      const result = await response.json();

      if (result.success) {
        setDeploySuccess(true);
        setTimeout(() => setDeploySuccess(false), 5000); // Clear success message after 5 seconds
      } else {
        setError(result.error || "Deploy tetikleme başarısız");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deploy tetikleme hatası");
    } finally {
      setDeployLoading(false);
    }
  };

  const publishNews = async () => {
    if (!newsContent.trim() || !newsTitle.trim() || !newsCategory) {
      setError("İçerik, başlık ve kategori alanları zorunludur");

      return;
    }

    setNewsPublishLoading(true);
    setError("");

    try {
      const payload: PublishNewsPayload = {
        action: "publish-news",
        content: newsContent.trim(),
        title: newsTitle.trim(),
        category: newsCategory,
        tags: newsTags,
      };

      // Add optional fields if provided
      if (newsSummary.trim()) {
        payload.summary = newsSummary.trim();
      }

      if (newsImageUrl.trim()) {
        payload.image = newsImageUrl.trim();
      }

      await performAction(payload);

      // Clear form on success
      setNewsContent("");
      setNewsTitle("");
      setNewsSummary("");
      setNewsImageUrl("");
      setNewsImageFile(null);
      setNewsTags([]);
      setNewsCategory("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Haber yayınlama hatası");
    } finally {
      setNewsPublishLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const userIsAdmin =
    userInfo.pubkey && adminData?.adminUsers.includes(userInfo.pubkey);
  const userIsEditor =
    userInfo.pubkey && adminData?.editorUsers.includes(userInfo.pubkey);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
            Yönetim Paneli
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bitcoin Son Dakika - İçerik Yönetimi
          </p>

          {publishSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-800 dark:text-green-300">
                {publishSuccess.message}

                <p>Gönderilen eventler:</p>
                {publishSuccess.result.map((result) => {
                  if (result.success) {
                    return (
                      <p key={result.relay}>"Başarılı" ({result.relay})</p>
                    );
                  } else {
                    return (
                      <p key={result.relay} className="text-red-500">
                        "Başarısız" ({result.relay}) {(result as any).error}
                      </p>
                    );
                  }
                })}
              </AlertDescription>
            </Alert>
          )}

          {userInfo.pubkey ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                <Key className="h-3 w-3 mr-1" />
                {userInfo.pubkey.substring(0, 16)}...
              </Badge>
              {userIsAdmin && <Badge variant="default">Admin</Badge>}
              {userIsEditor && <Badge variant="secondary">Editör</Badge>}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                İşlem yapmak için Nostr uzantısı gerekli. Veriler görüntüleme
                genel erişime açıktır.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Admin Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {adminData?.adminUsers.length || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Yöneticiler
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {adminData?.editorUsers.length || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Editörler</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {adminData?.news.length || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Haberler</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <RefreshCw className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {adminData?.articles.length || 0}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">Makaleler</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bitcoinsondakika olarak Haber Gir - Show if user is editor */}
        {userIsEditor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Bitcoinsondakika olarak Haber Gir
              </CardTitle>
              <CardDescription>
                Yeni bir haber içeriği oluştur ve doğrudan yayınla
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Content Column */}
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="newsContent"
                      className="text-base font-medium"
                    >
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
                </div>

                {/* Metadata Column */}
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <Label
                      htmlFor="newsTitle"
                      className="text-base font-medium"
                    >
                      Başlık *
                    </Label>
                    <Input
                      id="newsTitle"
                      placeholder="Haber başlığı"
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <Label
                      htmlFor="newsCategory"
                      className="text-base font-medium"
                    >
                      Kategori *
                    </Label>
                    <Select
                      value={newsCategory}
                      onValueChange={setNewsCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() +
                              category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Summary */}
                  <div>
                    <Label
                      htmlFor="newsSummary"
                      className="text-base font-medium"
                    >
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          disabled
                        >
                          <Upload className="h-4 w-4" />
                          Dosya Yükle
                        </Button>
                        <span className="text-sm text-gray-500">
                          (Yakında eklenecek)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <Label className="text-base font-medium">Etiketler</Label>
                    <div className="space-y-2">
                      <Select onValueChange={addTag}>
                        <SelectTrigger className="bg-white dark:bg-gray-800">
                          <SelectValue placeholder="Etiket ekle" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORY_OPTIONS.filter(
                            (tag) => !newsTags.includes(tag),
                          ).map((tag) => (
                            <SelectItem key={tag} value={tag}>
                              {tag.charAt(0).toUpperCase() + tag.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Selected Tags */}
                      {newsTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newsTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
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

                  {/* Publish Button */}
                  <div className="pt-4">
                    <Button
                      onClick={publishNews}
                      disabled={
                        newsPublishLoading ||
                        !newsContent.trim() ||
                        !newsTitle.trim() ||
                        !newsCategory
                      }
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
            </CardContent>
          </Card>
        )}

        {/* Content Curation - Show if user is editor */}
        {(userIsEditor || userIsAdmin) && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* News Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Haber Küratörlüğü ({adminData?.news.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Küratörlenen haber içerikleri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {adminData?.news.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        Henüz haber eklenmemiş
                      </p>
                    ) : (
                      adminData?.news.map((newsItem) => (
                        <div
                          key={`${newsItem.eTag}-${newsItem.relay}`}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <div>
                            <a
                              className="font-mono text-sm"
                              href={`https://njump.me/${nip19.neventEncode({
                                id: newsItem.eTag,
                                relays: [newsItem.relay],
                              })}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {newsItem.eTag.substring(0, 6)}...
                              {newsItem.eTag.substring(
                                newsItem.eTag.length - 6,
                                newsItem.eTag.length,
                              )}
                            </a>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading === "remove-news"}
                            onClick={() =>
                              removeNews(newsItem.eTag, newsItem.relay)
                            }
                          >
                            {actionLoading === "remove-news" ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="newsEventId">Yeni Haber Ekle</Label>
                    <Input
                      id="newsEventId"
                      placeholder="Event ID girin"
                      value={newsEventId}
                      onChange={(e) => setNewsEventId(e.target.value)}
                    />
                    <Input
                      placeholder="Relay URL"
                      value={newsRelay}
                      onChange={(e) => setNewsRelay(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      variant="secondary"
                      disabled={
                        !newsEventId.trim() ||
                        !newsRelay.trim() ||
                        actionLoading === "add-news"
                      }
                      onClick={addNews}
                    >
                      {actionLoading === "add-news" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Haber Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Article Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5" />
                    Makale Küratörlüğü ({adminData?.articles.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Küratörlenen makale içerikleri
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {adminData?.articles.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        Henüz makale eklenmemiş
                      </p>
                    ) : (
                      adminData?.articles.map((articleItem) => {
                        const [kind, pubkey, dTag] =
                          articleItem.aTag.split(":");

                        return (
                          <div
                            key={`${articleItem.aTag}-${articleItem.relay}`}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div>
                              <a
                                className="font-mono text-sm"
                                href={`https://njump.me/${nip19.naddrEncode({
                                  identifier: dTag,
                                  kind: Number(kind),
                                  pubkey: pubkey,
                                })}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {articleItem.aTag.substring(0, 6)}...
                                {articleItem.aTag.substring(
                                  articleItem.aTag.length - 6,
                                  articleItem.aTag.length,
                                )}
                              </a>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading === "remove-article"}
                              onClick={() =>
                                removeArticle(
                                  articleItem.aTag,
                                  articleItem.relay,
                                )
                              }
                            >
                              {actionLoading === "remove-article" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label>Yeni Makale Ekle</Label>

                    {/* Input Method Toggle */}
                    <div className="flex gap-2">
                      <Button
                        variant={
                          articleInputMethod === "naddr" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setArticleInputMethod("naddr")}
                      >
                        NAddr Girişi
                      </Button>
                      <Button
                        variant={
                          articleInputMethod === "fields"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setArticleInputMethod("fields")}
                      >
                        Manuel Giriş
                      </Button>
                    </div>

                    {articleInputMethod === "naddr" ? (
                      <div className="space-y-3">
                        <Input
                          placeholder="naddr1..."
                          value={articleNaddr}
                          onChange={(e) => setArticleNaddr(e.target.value)}
                        />
                        <p className="text-sm text-gray-500">
                          NAddr formatında makale adresini girin
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <Input
                            placeholder={userInfo.pubkey || "Yazar Pubkey"}
                            value={articlePubkey}
                            onChange={(e) => setArticlePubkey(e.target.value)}
                          />
                          {userInfo.pubkey && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setArticlePubkey(userInfo.pubkey || "")
                              }
                              className="mt-1"
                            >
                              Kendi pubkey'imi kullan
                            </Button>
                          )}
                        </div>

                        <Input
                          placeholder="D Tag (Makale ID)"
                          value={articleDTag}
                          onChange={(e) => setArticleDTag(e.target.value)}
                        />

                        <Input
                          placeholder="wss://relay.example.com (isteğe bağlı)"
                          value={articleRelay}
                          onChange={(e) => setArticleRelay(e.target.value)}
                        />

                        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>A Tag Preview:</strong>{" "}
                            {articlePubkey && articleDTag
                              ? `30023:${articlePubkey}:${articleDTag}`
                              : "Pubkey ve D Tag gerekli"}
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      disabled={
                        actionLoading === "add-article" ||
                        (articleInputMethod === "naddr"
                          ? !articleNaddr.trim()
                          : !articlePubkey.trim() || !articleDTag.trim())
                      }
                      onClick={addArticle}
                    >
                      {actionLoading === "add-article" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4 mr-2" />
                      )}
                      Makale Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deploy Trigger Section */}
            {userIsAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Rocket className="h-5 w-5" />
                    Site Deployment
                  </CardTitle>
                  <CardDescription>
                    Değişiklikleri canlı siteye uygula
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deploySuccess && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-300">
                        Deploy başarıyla tetiklendi! Site birkaç dakika içinde
                        güncellenecek.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-4">
                    <Button
                      onClick={triggerDeploy}
                      disabled={deployLoading}
                      className="flex items-center gap-2"
                    >
                      {deployLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Rocket className="h-4 w-4" />
                      )}
                      {deployLoading
                        ? "Deploy Tetikleniyor..."
                        : "Deploy Tetikle"}
                    </Button>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Son değişiklikleri canlı siteye uygular
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Admin Management - Only show if user is admin */}
        {userIsAdmin && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Admin Users Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Yöneticiler ({adminData?.adminUsers.length || 0})
                  </CardTitle>
                  <CardDescription>
                    Kullanıcı ekleyip çıkarabilir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {adminData?.adminUsers.map((pubkey) => (
                      <div
                        key={pubkey}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <a
                          className="font-mono text-sm"
                          href={`https://njump.me/${nip19.nprofileEncode({
                            pubkey: pubkey,
                            relays: PROFILE_RELAYS,
                          })}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {pubkey.substring(0, 6)}...
                          {pubkey.substring(pubkey.length - 6, pubkey.length)}
                        </a>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={
                            actionLoading === "remove-admin-pubkey" ||
                            adminData.adminUsers.length === 1
                          }
                          onClick={() => removeAdmin(pubkey)}
                        >
                          {actionLoading === "remove-admin-pubkey" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="newAdminPubkey">Yeni Yönetici Ekle</Label>
                    <Input
                      id="newAdminPubkey"
                      placeholder="Pubkey'i girin"
                      value={newAdminPubkey}
                      onChange={(e) => setNewAdminPubkey(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      disabled={
                        !newAdminPubkey.trim() ||
                        actionLoading === "add-admin-pubkey"
                      }
                      onClick={addAdmin}
                    >
                      {actionLoading === "add-admin-pubkey" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Yönetici Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Editor Users Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Editörler ({adminData?.editorUsers.length || 0})
                  </CardTitle>
                  <CardDescription>
                    İçerik yayınlayabilir ve deploy tetikleyebilir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {adminData?.editorUsers.map((pubkey) => (
                      <div
                        key={pubkey}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <a
                          className="font-mono text-sm"
                          href={`https://njump.me/${nip19.nprofileEncode({
                            pubkey: pubkey,
                            relays: PROFILE_RELAYS,
                          })}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {pubkey.substring(0, 6)}...
                          {pubkey.substring(pubkey.length - 6, pubkey.length)}
                        </a>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading === "remove-editor-pubkey"}
                          onClick={() => removeEditor(pubkey)}
                        >
                          {actionLoading === "remove-editor-pubkey" ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="newEditorPubkey">Yeni Editör Ekle</Label>
                    <Input
                      id="newEditorPubkey"
                      placeholder="Pubkey'i girin"
                      value={newEditorPubkey}
                      onChange={(e) => setNewEditorPubkey(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      variant="secondary"
                      disabled={
                        !newEditorPubkey.trim() ||
                        actionLoading === "add-editor-pubkey"
                      }
                      onClick={addEditor}
                    >
                      {actionLoading === "add-editor-pubkey" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="h-4 w-4 mr-2" />
                      )}
                      Editör Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* No permissions message */}
        {userInfo.pubkey && !userIsAdmin && !userIsEditor && (
          <Alert>
            <AlertDescription>
              Bu hesap için henüz yetki tanımlanmamış. Yöneticiden yetki talep
              edin.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
