import { AlertCircle, Loader2, X } from "lucide-react";
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
import PodcastComposer from "@/components/admin/PodcastComposer";
import PodcastCuration from "@/components/admin/PodcastCuration";
import NewsSources from "@/components/admin/NewsSources";
import UserManagement from "@/components/admin/UserManagement";
import { createNIP98Auth } from "@/components/admin/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/UserMenu";
import { pool } from "@/lib/utils";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import type { ArticleTag, NewsTag, PodcastTag } from "../../api-helpers/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

import { ADMIN_RELAYS } from "../../api-helpers/utils";
import {
  isMultiPublishResponse,
  isPublishResponseError,
  isPublishResponseSuccess,
  isSinglePublishResponse,
  MultiPublishResponse,
  PublishResponse,
  PublishResponseSchema,
  SinglePublishResponse,
} from "../../api-helpers/schemas";
import { Payload } from "@/types/admin";

// Displayed while the route hydrates on initial load
export function HydrateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Yükleniyor...</span>
      </div>
    </div>
  );
}

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
  podcasts: PodcastTag[];
  podcastsLastTimeUpdated: number;
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

  const [publishSuccess, setPublishSuccess] = useState<
    (SinglePublishResponse | MultiPublishResponse)[]
  >([]);
  const [composerPrefill, setComposerPrefill] = useState<any | null>(null);
  const [composerPrefillToken, setComposerPrefillToken] = useState<string>("");

  // Edit state for articles and podcasts
  const [editingArticle, setEditingArticle] = useState<any | null>(null);
  const [editingPodcast, setEditingPodcast] = useState<any | null>(null);

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
          {
            authors: [MASTER_ADMIN_PUBKEY],
            kinds: [30004],
            "#d": ["podcasts"],
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

            const podcastsEvent = events.get("podcasts");

            if (!podcastsEvent) {
              setError("Podcastleri yüklerken hata oluştu, logları kontrol ediniz");
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

            const news: NewsTag[] = newsEvent.tags
              .filter((tag) => tag[0] === "e" && tag.length > 2)
              .map((tag) => ({
                eTag: tag[1],
                relays: tag.slice(2),
              }));

            const newsLastTimeUpdated = newsEvent.created_at * 1000;

            const articles: ArticleTag[] = articlesEvent.tags
              .filter((tag) => tag[0] === "a" && tag.length > 2)
              .map((tag) => ({
                aTag: tag[1],
                relays: tag.slice(2),
              }));

            const articlesLastTimeUpdated = articlesEvent.created_at * 1000;

            const podcasts: PodcastTag[] = podcastsEvent.tags
              .filter((tag) => tag[0] === "a" && tag.length > 2)
              .map((tag) => ({
                aTag: tag[1],
                relays: tag.slice(2),
              }));

            const podcastsLastTimeUpdated = podcastsEvent.created_at * 1000;

            setAdminData({
              adminUsers,
              adminsLastTimeUpdated,
              editorUsers,
              editorsLastTimeUpdated,
              news,
              newsLastTimeUpdated,
              articles,
              articlesLastTimeUpdated,
              podcasts,
              podcastsLastTimeUpdated,
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
      const pubkey = await getPublicKey({ options: { reason: "Admin panel yetki kontrolü" } });

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

    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;
      const authHeader = await createNIP98Auth(
        "POST",
        url,
        () => getPublicKey({ options: { reason: "Admin panel işlemleri" } }),
        (params) =>
          signEvent({ event: params.event, options: { reason: "Admin panel işlemleri" } }),
      );

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(data),
      });

      const result: PublishResponse = await response.json();

      PublishResponseSchema.parse(result);

      if (isPublishResponseError(result)) {
        setError(result.message);

        return;
      }

      await loadAdminData();

      setPublishSuccess((prev) => [...prev, result]);

      // Show reminder toast after publish actions
      if (
        data.action === "publish-news" ||
        data.action === "publish-article" ||
        data.action === "publish-podcast" ||
        data.action === "remove-article" ||
        data.action === "remove-podcast" ||
        data.action === "remove-news"
      ) {
        toast({
          title: "Yayın başarılı",
          description: "İşiniz bittiyse deploy etmeyi unutmayın.",
          variant: "success",
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Yönetim Paneli</h1>
              <p className="text-muted-foreground">Bitcoin Son Dakika - İçerik Yönetimi</p>
            </div>
            <UserMenu />
          </div>

          {publishSuccess &&
            publishSuccess.length > 0 &&
            publishSuccess.map((ps) => {
              if (isSinglePublishResponse(ps)) {
                return (
                  <Alert className="border-green-200 bg-green-50 relative">
                    <button
                      onClick={() => setPublishSuccess([])}
                      className="absolute top-2 right-2 text-green-600 hover:text-green-800 cursor-pointer text-lg font-bold"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <AlertDescription className="text-green-800">
                        <span className="font-bold">{ps.message}</span>

                        <p>Gönderilen eventler:</p>
                        {ps.result.map((result) => {
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
                  </Alert>
                );
              } else if (isMultiPublishResponse(ps)) {
                return (
                  <Alert className="border-green-200 bg-green-50 relative">
                    <button
                      onClick={() => setPublishSuccess([])}
                      className="absolute top-2 right-2 text-green-600 hover:text-green-800 cursor-pointer text-lg font-bold"
                    >
                      ×
                    </button>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <AlertDescription className="text-green-800">
                        {Object.values(ps.result).map((result, index) => {
                          return (
                            <>
                              <p key={index}>
                                <span className="font-bold">{result.message}</span>
                              </p>
                              <p>Gönderilen eventler:</p>
                              {result.result.map((result) => {
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

                              <br />
                            </>
                          );
                        })}
                      </AlertDescription>
                    </div>
                  </Alert>
                );
              } else {
                return null;
              }
            })}

          {userInfo.pubkey && (
            <div className="flex items-center gap-2">
              {userIsAdmin && <Badge variant="default">Admin</Badge>}
              {userIsEditor && <Badge variant="default">Editör</Badge>}
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
            {userIsEditor && <TabsTrigger value="compose-podcast">Podcast Yayınla</TabsTrigger>}
            {(userIsEditor || userIsAdmin) && (
              <TabsTrigger value="news">Haber Kürasyonu</TabsTrigger>
            )}
            {(userIsEditor || userIsAdmin) && (
              <TabsTrigger value="articles">Makale Kürasyonu</TabsTrigger>
            )}
            {(userIsEditor || userIsAdmin) && (
              <TabsTrigger value="podcasts">Podcast Kürasyonu</TabsTrigger>
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

                if (tab === "compose-article" && !userIsEditor) {
                  return;
                }

                if (tab === "compose-podcast" && !userIsEditor) {
                  return;
                }

                if (tab === "sources" && !userIsEditor) {
                  return;
                }

                if (tab === "podcasts" && !(userIsEditor || userIsAdmin)) {
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
              <ArticleComposer
                performAction={performAction}
                editData={editingArticle}
                onCancelEdit={() => setEditingArticle(null)}
              />
            </TabsContent>
          )}

          {userIsEditor && (
            <TabsContent value="compose-podcast">
              <PodcastComposer
                performAction={performAction}
                editData={editingPodcast}
                onCancelEdit={() => setEditingPodcast(null)}
              />
            </TabsContent>
          )}

          {(userIsEditor || userIsAdmin) && (
            <TabsContent value="news">
              <NewsCuration
                news={adminData?.news || []}
                lastUpdated={adminData?.newsLastTimeUpdated || 0}
                performAction={performAction}
                reload={loadAdminData}
                setPublishSuccess={setPublishSuccess}
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
                onEditArticle={(articleData) => {
                  setEditingArticle(articleData);
                  changeTab("compose-article");
                }}
              />
            </TabsContent>
          )}

          {(userIsEditor || userIsAdmin) && (
            <TabsContent value="podcasts">
              <PodcastCuration
                podcasts={adminData?.podcasts || []}
                lastUpdated={adminData?.podcastsLastTimeUpdated || 0}
                performAction={performAction}
                reload={loadAdminData}
                onEditPodcast={(podcastData) => {
                  setEditingPodcast(podcastData);
                  changeTab("compose-podcast");
                }}
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
