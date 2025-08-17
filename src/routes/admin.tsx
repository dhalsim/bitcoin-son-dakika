import { Key, AlertCircle, Loader2 } from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { nip19 } from "nostr-tools";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import AdminStatistics, { AdminTab } from "@/components/admin/AdminStatistics";
import ArticleCuration from "@/components/admin/ArticleCuration";
import DeployTrigger from "@/components/admin/DeployTrigger";
import NewsComposer from "@/components/admin/NewsComposer";
import NewsCuration from "@/components/admin/NewsCuration";
import ArticleComposer from "@/components/admin/ArticleComposer";
import NewsSources from "@/components/admin/NewsSources";
import UserManagement from "@/components/admin/UserManagement";
import { createNIP98Auth } from "@/components/admin/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/UserMenu";
import { pool } from "@/lib/utils";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import type { ArticleTag, NewsTag } from "../../api-helpers/utils";
import type { PublishArticlePayload } from "../../api-helpers/admin/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ADMIN_RELAYS, type PublishEventResponse } from "../../api-helpers/utils";
import { toast } from "@/hooks/use-toast";

// Displayed while the route hydrates on initial load
export function HydrateFallback() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center p-8">
      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Yükleniyor...</span>
      </div>
    </div>
  );
}

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
  | PublishNewsPayload
  | PublishArticlePayload;

const MASTER_ADMIN_PUBKEY = "5fb571abb0a02ff241fc6090437ef1516157c66e03918ac519befea6475b72df";

interface AdminData {
  adminUsers: string[];
  adminsLastTimeUpdated: number;
  editorUsers: string[];
  editorsLastTimeUpdated: number;
  news: NewsTag[];
  newsLastTimeUpdated: number;
  articles: ArticleTag[];
  articlesLastTimeUpdated: number;
}

interface UserInfo {
  pubkey?: string;
  roles?: string[];
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [error, setError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string>("");

  const { getPublicKey, signEvent } = useNostrAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get("tab") as AdminTab) || "stats";
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  const [publishSuccess, setPublishSuccess] = useState<PublishEventResponse | null>(null);
  const [composerPrefill, setComposerPrefill] = useState<any | null>(null);
  const [composerPrefillToken, setComposerPrefillToken] = useState<string>("");

  // Sync from URL on back/forward
  useEffect(() => {
    const urlTab = (searchParams.get("tab") as AdminTab) || "stats";
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const changeTab = useCallback(
    (tab: AdminTab) => {
      setActiveTab(tab);
      const next = new URLSearchParams(searchParams);
      next.set("tab", tab);
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const loadAdminData = useCallback(async () => {
    setLoading(true);

    try {
      const events: Map<string, NostrEvent> = new Map();

      pool.subscribeMany(
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
            const dTag = evt.tags.find((tag) => tag[0] === "d")?.[1];

            if (!dTag) {
              throw new Error("d tag bulunamadı");
            }

            const existingEvent = events.get(dTag);

            if (existingEvent && existingEvent.created_at > evt.created_at) {
              return;
            }

            events.set(dTag, evt);
          },
          oneose() {
            console.log(events);

            const adminUsersEvent = events.get("admin-users");

            if (!adminUsersEvent) {
              setError("Admin kullanıcılarını yüklerken hata oluştu, logları kontrol ediniz");
              setLoading(false);

              return;
            }

            const editorUsersEvent = events.get("editor-users");

            if (!editorUsersEvent) {
              setError("Editör kullanıcılarını yüklerken hata oluştu, logları kontrol ediniz");
              setLoading(false);

              return;
            }

            const newsEvent = events.get("news");

            if (!newsEvent) {
              setError("Haberleri yüklerken hata oluştu, logları kontrol ediniz");
              setLoading(false);

              return;
            }

            const articlesEvent = events.get("articles");

            if (!articlesEvent) {
              setError("Makaleleri yüklerken hata oluştu, logları kontrol ediniz");
              setLoading(false);

              return;
            }

            const adminUsers = adminUsersEvent.tags
              .filter((tag) => tag[0] === "p")
              .map((tag) => tag[1])
              .filter(Boolean);

            const adminsLastTimeUpdated = adminUsersEvent.created_at * 1000;

            const editorUsers = editorUsersEvent.tags
              .filter((tag) => tag[0] === "p")
              .map((tag) => tag[1])
              .filter(Boolean);

            const editorsLastTimeUpdated = editorUsersEvent.created_at * 1000;

            const news = newsEvent.tags
              .filter((tag) => tag[0] === "e")
              .map((tag) => ({
                eTag: tag[1],
                relay: tag[2],
              }))
              .filter((item) => item.eTag);

            const newsLastTimeUpdated = newsEvent.created_at * 1000;

            const articles = articlesEvent.tags
              .filter((tag) => tag[0] === "a")
              .map((tag) => ({
                aTag: tag[1],
                relay: tag[2],
              }))
              .filter((item) => item.aTag);

            const articlesLastTimeUpdated = articlesEvent.created_at * 1000;

            setAdminData({
              adminUsers,
              adminsLastTimeUpdated,
              editorUsers,
              editorsLastTimeUpdated,
              news,
              newsLastTimeUpdated,
              articles,
              articlesLastTimeUpdated,
            });

            setLoading(false);
          },
        },
      );
    } catch (err) {
      console.error("Error loading admin data from Nostr:", err);

      setError(`Nostr verilerini yüklerken hata oluştu: ${err}`);
    }
  }, []);

  const checkUserInfo = useCallback(async () => {
    try {
      const pubkey = await getPublicKey({ reason: "Admin panel yetki kontrolü" });

      if (!pubkey) {
        setUserInfo({});
        setError("Pubkey okunamadı");
        return;
      }

      const roles = [
        adminData?.adminUsers.includes(pubkey) ? "admin" : null,
        adminData?.editorUsers.includes(pubkey) ? "editor" : null,
      ].filter(Boolean);

      setUserInfo({ pubkey, roles });
      setError(""); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pubkey okunamadı");
      setUserInfo({});
    }
  }, [adminData, getPublicKey]);

  useEffect(() => {
    loadAdminData();
    checkUserInfo();
  }, []);

  const performAction = async (data: Payload) => {
    setActionLoading(data.action);

    setError("");

    setPublishSuccess(null);

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;
      const authHeader = await createNIP98Auth(
        "POST",
        url,
        () => getPublicKey({ reason: "Admin panel işlemleri" }),
        (event) => signEvent(event, { reason: "Admin panel işlemleri" }),
      );

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

        // Show reminder toast after publish actions
        if (data.action === "publish-news" || data.action === "publish-article") {
          toast({
            title: "Yayın başarılı",
            description: "İşiniz bittiyse deploy etmeyi unutmayın.",
            variant: "success",
          });
        }
      } else {
        setError(result.error || "İşlem başarısız");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setActionLoading("");
    }
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

  const userIsAdmin = userInfo.pubkey && adminData?.adminUsers.includes(userInfo.pubkey);
  const userIsEditor = userInfo.pubkey && adminData?.editorUsers.includes(userInfo.pubkey);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                Yönetim Paneli
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Bitcoin Son Dakika - İçerik Yönetimi
              </p>
            </div>
            <UserMenu />
          </div>

          {publishSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <AlertDescription className="text-green-800 dark:text-green-300">
                    {publishSuccess.message}

                    <p>Gönderilen eventler:</p>
                    {publishSuccess.result.map((result) => {
                      if (result.success) {
                        return <p key={result.relay}>"Başarılı" ({result.relay})</p>;
                      } else {
                        return (
                          <p key={result.relay} className="text-red-500">
                            "Başarısız" ({result.relay}) {(result as any).error}
                          </p>
                        );
                      }
                    })}
                  </AlertDescription>
                </div>
                <button
                  onClick={() => setPublishSuccess(null)}
                  className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors"
                  aria-label="Close alert"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </Alert>
          )}

          {userInfo.pubkey && (
            <div className="flex items-center gap-2">
              {userIsAdmin && <Badge variant="default">Admin</Badge>}
              {userIsEditor && <Badge variant="secondary">Editör</Badge>}
            </div>
          )}

          {!userInfo.pubkey && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                İşlem yapmak için Nostr uzantısı gerekli. Veriler görüntüleme genel erişime açıktır.
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

        {actionLoading && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {actionLoading} işlemi yapılıyor, lütfen bekleyiniz...
            </AlertDescription>
          </Alert>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => changeTab(value as AdminTab)}
          className="mt-6"
        >
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="stats">İstatistikler</TabsTrigger>
            {userIsEditor && <TabsTrigger value="compose">Haber Yayınla</TabsTrigger>}
            {userIsEditor && <TabsTrigger value="compose-article">Makale Yayınla</TabsTrigger>}
            {(userIsEditor || userIsAdmin) && (
              <TabsTrigger value="news">Haber Kürasyonu</TabsTrigger>
            )}
            {(userIsEditor || userIsAdmin) && (
              <TabsTrigger value="articles">Makale Kürasyonu</TabsTrigger>
            )}
            {userIsEditor && <TabsTrigger value="sources">Haber Kaynakları</TabsTrigger>}
            {userIsAdmin && <TabsTrigger value="users">Kullanıcılar</TabsTrigger>}
          </TabsList>

          <TabsContent value="stats">
            <AdminStatistics
              adminData={adminData}
              onOpenTab={(tab) => {
                // Enforce permissions: only allow switching to tabs that are visible
                if (tab === "news" && !(userIsEditor || userIsAdmin)) {
                  return;
                }

                if (tab === "articles" && !(userIsEditor || userIsAdmin)) {
                  return;
                }

                if (tab === "users" && !userIsAdmin) {
                  return;
                }

                if (tab === "compose" && !userIsEditor) {
                  return;
                }

                if (tab === "sources" && !userIsEditor) {
                  return;
                }

                if (tab === "compose-article" && !userIsEditor) {
                  return;
                }

                changeTab(tab);
              }}
            />
          </TabsContent>

          {userIsEditor && (
            <TabsContent value="compose">
              <NewsComposer
                performAction={performAction}
                prefill={composerPrefill || undefined}
                prefillToken={composerPrefillToken}
              />
            </TabsContent>
          )}

          {userIsEditor && (
            <TabsContent value="compose-article">
              <ArticleComposer performAction={performAction} />
            </TabsContent>
          )}

          {(userIsEditor || userIsAdmin) && (
            <TabsContent value="news">
              <NewsCuration
                news={adminData?.news || []}
                lastUpdated={adminData?.newsLastTimeUpdated || 0}
                performAction={performAction}
                reload={loadAdminData}
              />
            </TabsContent>
          )}

          {(userIsEditor || userIsAdmin) && (
            <TabsContent value="articles">
              <ArticleCuration
                articles={adminData?.articles || []}
                lastUpdated={adminData?.articlesLastTimeUpdated || 0}
                performAction={performAction}
                reload={loadAdminData}
                userNpub={userInfo.pubkey ? nip19.npubEncode(userInfo.pubkey) : undefined}
              />
            </TabsContent>
          )}

          {userIsEditor && (
            <TabsContent value="sources">
              <NewsSources
                onPrefill={(data) => {
                  setComposerPrefill(data);
                  setComposerPrefillToken(`${Date.now()}`);
                  changeTab("compose");
                }}
              />
            </TabsContent>
          )}

          {/* Deploy moved out of tabs */}

          {userIsAdmin && (
            <TabsContent value="users">
              <UserManagement
                adminUsers={adminData?.adminUsers || []}
                editorUsers={adminData?.editorUsers || []}
                performAction={performAction}
              />
            </TabsContent>
          )}
        </Tabs>

        {userIsEditor && (
          <div className="mt-6">
            <DeployTrigger />
          </div>
        )}

        {/* No permissions message */}
        {userInfo.pubkey && !userIsAdmin && !userIsEditor && (
          <Alert>
            <AlertDescription>
              Bu hesap için henüz yetki tanımlanmamış. Yöneticiden yetki talep edin.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
