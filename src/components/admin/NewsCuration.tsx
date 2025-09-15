import { AlertCircle, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { EventTemplate, nip19 } from "nostr-tools";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EventItem } from "@/lib/nip01";
import { getKind1Events } from "@/lib/nip01";
import { useUserContext } from "@/contexts/UserContext";
import { SignEventResult, useNostrAuth } from "@/contexts/NostrAuthContext";
import { formatNostrDate, links, publishToRelays } from "@/lib/utils";
import { WEBSITE_URL } from "@/lib/constants";

import type { MultiPublishResponse, SinglePublishResponse } from "../../../api-helpers/schemas";
import {
  ADMIN_RELAYS,
  createTitleSlug,
  MASTER_ADMIN_PUBKEY,
  type NewsTag,
} from "../../../api-helpers/utils";

import UploadToX from "./UploadToX";
import { publishToX } from "./utils";
import { AddNewsPayload, RemoveNewsPayload } from "@/types/admin";

type NewsCurationProps = {
  news: NewsTag[];
  lastUpdated: number;
  performAction: (data: AddNewsPayload | RemoveNewsPayload) => Promise<any>;
  setPublishSuccess: React.Dispatch<
    React.SetStateAction<(SinglePublishResponse | MultiPublishResponse)[]>
  >;
  reload: () => Promise<void> | void;
};

export default function NewsCuration({
  news,
  lastUpdated,
  performAction,
  setPublishSuccess,
  reload,
}: NewsCurationProps) {
  const { userProfile } = useUserContext();
  const [newsEventId, setNewsEventId] = useState("");
  const [newsRelays, setNewsRelays] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [newsEvents, setNewsEvents] = useState<Map<string, EventItem>>(new Map());
  const [shareData, setShareData] = useState<EventItem | null>(null);
  const [deletionDialogOpen, setDeletionDialogOpen] = useState(false);
  const [pendingDeletionEvent, setPendingDeletionEvent] = useState<EventItem | null>(null);
  const { signEvent } = useNostrAuth();

  useEffect(() => {
    if (news.length > 0) {
      const relays = new Set(news.flatMap((n) => n.relays));
      const ids = news.map((n) => n.eTag);

      const cleanup = getKind1Events(Array.from(relays), ids, (events) => {
        setNewsEvents(events);
      });

      return () => {
        cleanup();
      };
    }
  }, [news]);

  const onAddNews = async () => {
    try {
      setAdding(true);

      await performAction({
        action: "add-news",
        tagToBeAdded: {
          eTag: newsEventId.trim(),
          relays: newsRelays.split(";").filter((r) => r.trim() !== ""),
        },
      });

      setNewsEventId("");
      setNewsRelays("");

      await reload();
    } finally {
      setAdding(false);
    }
  };

  const onRemoveNews = async (newsToBeRemoved: NewsTag, requestDeletion: boolean = false) => {
    const key = newsToBeRemoved.eTag;

    try {
      setRemovingKey(key);

      await performAction({
        action: "remove-news",
        tagToBeRemoved: newsToBeRemoved,
        requestDeletion,
      });

      if (!requestDeletion) {
        await reload();
      }
    } finally {
      setRemovingKey(null);
    }
  };

  const handleRemoveNewsClick = (event: EventItem) => {
    const userPubkey = userProfile?.pubkey;
    const isOwner = userPubkey === event.pubkey;
    const isMasterAccount = event.pubkey === MASTER_ADMIN_PUBKEY;

    if (isOwner || isMasterAccount) {
      // Show deletion confirmation dialog
      setPendingDeletionEvent(event);
      setDeletionDialogOpen(true);
    } else {
      // Show info about owner
      const ownerNpub = nip19.npubEncode(event.pubkey);

      alert(
        `Bu event ${ownerNpub} kullanıcısına ait. Silme talebinde bulunmak için onlarla iletişime geçebilirsiniz.`,
      );
    }
  };

  const confirmDeletion = async (sendDeleteRequest: boolean = false) => {
    const confirmationMessage = sendDeleteRequest
      ? "Haberi hem listeden kaldırıp, hem de ağdan silme talebinde bulunmak istediğinize emin misiniz? (e/h)"
      : "Haberi listeden kaldırmak istediğinize emin misiniz? (e/h)";

    const confirmation = prompt(confirmationMessage);

    if (confirmation !== "e") return;

    if (!pendingDeletionEvent) return;

    const userPubkey = userProfile?.pubkey;
    const isOwner = userPubkey === pendingDeletionEvent.pubkey;
    const isMasterAccount = pendingDeletionEvent.pubkey === MASTER_ADMIN_PUBKEY;

    if (isOwner) {
      await onRemoveNews(
        { eTag: pendingDeletionEvent.id, relays: pendingDeletionEvent.relays },
        false,
      );

      if (sendDeleteRequest) {
        const currentTime = Math.floor(Date.now() / 1000);

        const eventTemplate: EventTemplate = {
          kind: 5,
          created_at: currentTime,
          tags: [
            ["e", pendingDeletionEvent.id],
            ["k", String(pendingDeletionEvent.kind)],
          ],
          content: "This post was published by accident",
        };

        let requestDeletionSignedResult: SignEventResult | null = null;

        try {
          requestDeletionSignedResult = await signEvent({
            event: eventTemplate,
            options: { reason: "Haber silme" },
          });
        } catch (error) {
          alert("Yerel imzalama hatası: " + error);

          return;
        }

        if (requestDeletionSignedResult) {
          const requestDeletionResult = await publishToRelays(
            requestDeletionSignedResult.signedEvent,
            ADMIN_RELAYS,
          );

          setPublishSuccess((prev) => [
            ...prev,
            {
              type: "single-publish",
              success: requestDeletionResult.some((r) => r.success),
              message: "Silme talebi gönderildi.",
              result: requestDeletionResult,
            },
          ]);
        } else {
          alert("Yerel imzalama hatası: Yerel imzalama yapılamadı.");

          return;
        }
      }
    } else if (isMasterAccount) {
      // Master account event, use backend deletion
      await onRemoveNews(
        { eTag: pendingDeletionEvent.id, relays: pendingDeletionEvent.relays },
        sendDeleteRequest,
      );
    }

    setDeletionDialogOpen(false);
    setPendingDeletionEvent(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Haber Küratörlüğü ({news?.length || 0})
        </CardTitle>
        <CardDescription>
          Küratörlenen haber içerikleri, Son güncelleme:{" "}
          {new Date(lastUpdated || 0).toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {news?.length === 0 ? (
            <p className="text-gray-500 text-sm">Henüz haber eklenmemiş</p>
          ) : newsEvents.size === 0 ? (
            Array.from({ length: news.length }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="flex items-center justify-between p-3 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-72" />
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Skeleton className="h-8 w-20 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))
          ) : (
            Array.from(newsEvents.values())
              .sort((a, b) => b.created_at - a.created_at)
              .map((event) => {
                const content = event.content || "";
                const titleTag = event.tags.find((t) => t[0] === "title")?.[1];
                const summaryTag = event.tags.find((t) => t[0] === "summary")?.[1];
                const display = titleTag || summaryTag || content;
                const slug = createTitleSlug(titleTag);
                const url = `${WEBSITE_URL}${links.newsDetail(slug)}`;
                const nevent = nip19.neventEncode({
                  id: event.id,
                  relays: event.relays,
                  author: event.pubkey,
                  kind: event.kind,
                });

                return (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  >
                    <div className="min-w-0">
                      <div className="text-sm truncate max-w-[48ch]">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600 font-bold"
                        >
                          {display}
                        </a>
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        <a
                          href={`https://njump.me/${nevent}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          {event.id.substring(0, 6)}...{event.id.substring(event.id.length - 6)}
                        </a>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {event.relays.join(", ")} {formatNostrDate(event.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShareData(event);
                          setShareOpen(true);
                        }}
                        title="X'e yükle"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          className="h-4 w-4 text-muted-foreground"
                          viewBox="0 0 16 16"
                        >
                          <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
                        </svg>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={removingKey === event.id}
                        onClick={() => handleRemoveNewsClick(event)}
                      >
                        {removingKey === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })
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
            placeholder="wss://relay.url;wss://relay2.url"
            value={newsRelays}
            onChange={(e) => setNewsRelays(e.target.value)}
          />
          <Button
            className="w-full"
            variant="secondary"
            disabled={!newsEventId.trim() || !newsRelays.trim() || adding}
            onClick={onAddNews}
          >
            {adding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Haber Ekle
          </Button>
        </div>
      </CardContent>

      <UploadToX
        open={shareOpen}
        onOpenChange={setShareOpen}
        eventItem={shareData}
        publishToX={publishToX}
        type="news"
        width={800}
        height={600}
      />

      <Dialog open={deletionDialogOpen} onOpenChange={setDeletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Haber Silme Onayı</DialogTitle>
            <DialogDescription>
              Bu haberi hem listeden kaldırmak hem de ağdan silmek istiyor musunuz?
            </DialogDescription>
          </DialogHeader>

          {pendingDeletionEvent && (
            <>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>Event ID:</strong> {pendingDeletionEvent.id.substring(0, 8)}...
                    {pendingDeletionEvent.id.substring(pendingDeletionEvent.id.length - 8)}
                  </p>
                  <p>
                    <strong>Sahip:</strong> {pendingDeletionEvent.pubkey.substring(0, 8)}...
                    {pendingDeletionEvent.pubkey.substring(pendingDeletionEvent.pubkey.length - 8)}
                  </p>
                </div>

                {userProfile && userProfile.pubkey === pendingDeletionEvent.pubkey ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Bu event size ait. Listeden kaldiriltan sonra silme talebi gönderilecek.
                    </AlertDescription>
                  </Alert>
                ) : pendingDeletionEvent.pubkey === MASTER_ADMIN_PUBKEY ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Bu event ana hesaba ait. Backend üzerinden silme talebi gönderilecek.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Bu event size ait değil. Silme talebinde bulunmak için onlarla iletişime
                      geçebilirsiniz.
                      <p>Sahip: {nip19.npubEncode(pendingDeletionEvent.pubkey)}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeletionDialogOpen(false)}>
                  İptal
                </Button>
                {(userProfile?.pubkey === pendingDeletionEvent.pubkey ||
                  pendingDeletionEvent.pubkey === MASTER_ADMIN_PUBKEY) && (
                  <Button
                    variant="destructive"
                    className="bg-red-600"
                    onClick={() => confirmDeletion(true)}
                    disabled={removingKey === pendingDeletionEvent.id}
                  >
                    {removingKey === pendingDeletionEvent.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Kaldır ve Sil"
                    )}
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="bg-orange-600"
                  onClick={() => confirmDeletion(false)}
                  disabled={removingKey === pendingDeletionEvent.id}
                >
                  {removingKey === pendingDeletionEvent.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sadece Kaldır"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
