import { Zap } from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { useEffect, useState, memo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { EventStatistics } from "@/lib/event-statistics.js";
import type { ProfileItem } from "@/lib/nip01";
import { getNip07Relays, getUserPubkey } from "@/lib/nip07";
import type { LnUrlpResponse } from "@/lib/nip57";
import { getLnurlData } from "@/lib/nip57";
import { fetchNip65Relays } from "@/lib/nip65";
import { createZap, DEFAULT_ZAP_RELAYS } from "@/lib/zap-utils";

import { ZapInvoiceDialog } from "./ZapInvoiceDialog";

interface ZapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zappedEvent: NostrEvent;
  author: ProfileItem;
  statistics: EventStatistics;
  setStatistics: (statistics: EventStatistics) => void;
}

const PRESET_AMOUNTS = [21, 50, 100, 200];

export const ZapDialog = memo(function ZapDialog({
  open,
  onOpenChange,
  zappedEvent,
  author,
  statistics,
  setStatistics,
}: ZapDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoice, setInvoice] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState(0);
  const [invoiceComment, setInvoiceComment] = useState("");
  const [lnurlData, setLnurlData] = useState<LnUrlpResponse | null>(null);
  const [isLoadingLnurlData, setIsLoadingLnurlData] = useState(false);
  const [relays, setRelays] = useState<string[]>(DEFAULT_ZAP_RELAYS);
  const { toast } = useToast();

  useEffect(() => {
    const loadUserRelays = async () => {
      if (!lnurlData) {
        return;
      }

      const pubkey = await getUserPubkey();

      if (!pubkey) {
        return;
      }

      const nip07Relays = (await getNip07Relays()) || {
        readRelays: [],
        writeRelays: [],
      };

      fetchNip65Relays(pubkey, (nip65Relays) => {
        const relays = new Set([
          ...(nip65Relays?.readRelays || []),
          ...(nip07Relays.readRelays || []),
          ...DEFAULT_ZAP_RELAYS,
        ]);

        setRelays(Array.from(relays));
      });
    };

    loadUserRelays();
  }, [lnurlData]);

  useEffect(() => {
    setIsLoadingLnurlData(true);

    const fetchLnurlData = async () => {
      if (!author.lud16) {
        setLnurlData(null);
        setIsLoadingLnurlData(false);

        return;
      }

      try {
        const data = await getLnurlData(author.lud16);
        setLnurlData(data);
      } catch (error) {
        console.error("Failed to fetch LNURL data:", error);
        setLnurlData(null);
      } finally {
        setIsLoadingLnurlData(false);
      }
    };

    fetchLnurlData();
  }, [author]);

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleZap = async () => {
    const amountInSats = selectedAmount || parseInt(customAmount);

    if (amountInSats > 0) {
      setIsLoading(true);

      try {
        // Check if NIP-07 extension is available
        if (typeof window === "undefined" || !window.nostr) {
          toast({
            title: "NIP-07 Gerekli",
            description:
              "Zap göndermek için bir NIP-07 cüzdan uzantısı gereklidir.",
            variant: "destructive",
          });

          return;
        }

        const invoice = await createZap({
          zappedEvent,
          amountInSats,
          comment: comment.trim() || undefined,
          lnurlData,
          relays,
        });

        if (!invoice) {
          toast({
            title: "Hata",
            description: "Zap oluşturulamadı. Lütfen tekrar deneyin.",
            variant: "destructive",
          });

          return;
        }

        setInvoice(invoice);
        setInvoiceAmount(amountInSats);
        setInvoiceComment(comment.trim() || "");

        // Show invoice dialog
        setShowInvoice(true);

        // Reset form
        setSelectedAmount(null);
        setCustomAmount("");
        setComment("");

        toast({
          title: "Zap Hazır",
          description:
            "Fatura oluşturuldu. QR kodu tarayarak ödeme yapabilirsiniz.",
        });
      } catch (error) {
        console.error("Failed to create zap:", error);
        toast({
          title: "Hata",
          description: "Zap oluşturulamadı. Lütfen tekrar deneyin.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const finalAmount = selectedAmount || parseInt(customAmount) || 0;
  const isValidAmount = finalAmount > 0;

  if (isLoadingLnurlData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Zap Modal Yükleniyor...</span>
            </DialogTitle>
            <DialogDescription>
              Zap modalı yüklenirken lütfen bekleyin.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!lnurlData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Kullanıcının Nostr destekli bir Lightning Adresi Yok.</span>
            </DialogTitle>
            <DialogDescription>
              Bu kullanıcıya zap göndermek için Lightning adresi gereklidir.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open && !showInvoice} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Zap Gönder</span>
            </DialogTitle>
            <DialogDescription>
              Lightning Network üzerinden sats gönderin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Preset amounts */}
            <div>
              <Label className="text-sm font-medium">Hızlı Miktar Seçimi</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {PRESET_AMOUNTS.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick(amount)}
                    className="h-10"
                  >
                    {amount} sats
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <Label htmlFor="customAmount" className="text-sm font-medium">
                Özel Miktar (sats)
              </Label>
              <Input
                id="customAmount"
                type="number"
                placeholder="Özel miktar girin..."
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="mt-2"
                min="1"
              />
            </div>

            {/* Comment */}
            <div>
              <Label htmlFor="comment" className="text-sm font-medium">
                Yorum (İsteğe bağlı)
              </Label>
              <Textarea
                id="comment"
                placeholder="Zap ile birlikte bir mesaj gönderin..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2 min-h-[80px] resize-none"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1">
                {comment.length}/200 karakter
              </div>
            </div>

            {/* Summary */}
            {isValidAmount && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Gönderilecek miktar:</span>
                  <span className="font-semibold text-orange-700">
                    {finalAmount} sats
                  </span>
                </div>
                {comment && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Mesaj:</span> {comment}
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex space-x-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                İptal
              </Button>
              <Button
                className="flex-1 bg-orange-500 hover:bg-orange-600"
                onClick={handleZap}
                disabled={!isValidAmount || isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                ) : (
                  <Zap className="h-4 w-4 mr-1" />
                )}
                {isLoading ? "Hazırlanıyor..." : "Zap Gönder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog - Rendered outside the main dialog */}
      {showInvoice && (
        <ZapInvoiceDialog
          open={showInvoice}
          onOpenChange={setShowInvoice}
          invoice={invoice}
          amount={invoiceAmount}
          comment={invoiceComment}
          lnurlData={lnurlData}
          zappedEvent={zappedEvent}
          relays={relays}
          statistics={statistics}
          setStatistics={setStatistics}
        />
      )}
    </>
  );
});
