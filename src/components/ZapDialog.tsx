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
import type { LnUrlpResponse, ZapReceipt } from "@/lib/nip57";
import { getLnurlData } from "@/lib/nip57";
import { createZap, DEFAULT_ZAP_RELAYS, listenForZapReceipt } from "@/lib/zap-utils";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { useUserContext } from "@/contexts/UserContext";

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
  const [receipt, setReceipt] = useState<ZapReceipt | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [isWaitingForReceipt, setIsWaitingForReceipt] = useState(false);
  const { toast } = useToast();
  const { signEvent } = useNostrAuth();
  const { userRelays } = useUserContext();

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

      const authorReadRelays = author.nip65?.readRelays ?? [];
      const relays = [
        ...new Set([...authorReadRelays, ...userRelays.writeRelays, ...DEFAULT_ZAP_RELAYS]),
      ];

      try {
        const { invoice, provider: zapProvider } = await createZap({
          zappedEvent,
          amountInSats,
          comment: comment.trim() || undefined,
          lnurlData,
          relays,
          signEvent,
        });

        // If WebLN is available, try to pay the invoice programmatically.
        if (invoice && typeof window.webln !== "undefined" && window.webln.isEnabled) {
          try {
            const isEnabled = await window.webln.isEnabled();

            if (!isEnabled) {
              await window.webln.enable();
            }

            // Optional: inspect capabilities
            try {
              const info = await window.webln.getInfo();
              console.log("WebLN info", info);
            } catch (e) {
              // non-fatal
            }

            const payResult = await window.webln.sendPayment(invoice);
            console.log("WebLN payment result", payResult);

            // Show waiting state while listening for zap receipt
            setIsWaitingForReceipt(true);
            // Close the main input dialog while waiting
            onOpenChange(false);

            // Start listening for receipt immediately
            if (lnurlData) {
              listenForZapReceipt({
                event: zappedEvent,
                invoice,
                lnurlData,
                relays,
                onReceipt: (zapReceipt) => {
                  if (zapReceipt) {
                    setReceipt(zapReceipt);
                    setIsReceiptDialogOpen(true);
                    setIsWaitingForReceipt(false);
                    // Close the waiting dialog automatically
                    setShowInvoice(false);
                    setStatistics({
                      ...statistics,
                      zaps: new Map(statistics.zaps).set(zapReceipt.event.id, zapReceipt),
                    });
                  }
                },
                provider: zapProvider,
              });
            }

            return;
          } catch (weblnError) {
            console.warn("WebLN payment failed, falling back to manual flow", weblnError);
            // Continue to show invoice dialog for manual payment
          }
        }

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

        // Show invoice dialog for manual payment
        setShowInvoice(true);

        // Begin listening for zap receipt for manual payment
        if (lnurlData) {
          listenForZapReceipt({
            event: zappedEvent,
            invoice,
            lnurlData,
            relays,
            onReceipt: (zapReceipt) => {
              if (zapReceipt) {
                setReceipt(zapReceipt);
                setIsReceiptDialogOpen(true);
                // Close the invoice dialog automatically when receipt arrives
                setShowInvoice(false);
                setStatistics({
                  ...statistics,
                  zaps: new Map(statistics.zaps).set(zapReceipt.event.id, zapReceipt),
                });
              }
            },
            provider: zapProvider,
          });
        }

        // Reset form
        setSelectedAmount(null);
        setCustomAmount("");
        setComment("");

        toast({
          title: "Zap Hazır",
          description: "Fatura oluşturuldu. QR kodu tarayarak ödeme yapabilirsiniz.",
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
            <DialogDescription>Zap modalı yüklenirken lütfen bekleyin.</DialogDescription>
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
      <Dialog
        open={open && !showInvoice}
        onOpenChange={(openState) => {
          onOpenChange(openState);
          if (!openState) {
            // Reset all states when main dialog is closed
            setSelectedAmount(null);
            setCustomAmount("");
            setComment("");
            setShowInvoice(false);
            setIsWaitingForReceipt(false);
            setReceipt(null);
            setIsReceiptDialogOpen(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <span>Zap Gönder</span>
            </DialogTitle>
            <DialogDescription>Lightning Network üzerinden sats gönderin.</DialogDescription>
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
              <div className="text-xs text-gray-500 mt-1">{comment.length}/200 karakter</div>
            </div>

            {/* Summary */}
            {isValidAmount && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Gönderilecek miktar:</span>
                  <span className="font-semibold text-orange-700">{finalAmount} sats</span>
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
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
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

      {/* Invoice Dialog - presentation only */}
      {showInvoice && (
        <ZapInvoiceDialog
          open={showInvoice}
          onOpenChange={setShowInvoice}
          invoice={invoice}
          amount={invoiceAmount}
          comment={invoiceComment}
        />
      )}

      {/* Waiting for receipt dialog (WebLN flow) */}
      {isWaitingForReceipt && (
        <Dialog open={isWaitingForReceipt} onOpenChange={setIsWaitingForReceipt}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Zap makbuzu alınıyor</DialogTitle>
              <DialogDescription>
                Ödeme alındıktan sonra makbuz otomatik olarak görünecek.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
            <div className="text-center text-sm text-gray-500">
              WebLN ile ödeme yapıldı, makbuz bekleniyor...
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Receipt Dialog - shown when receipt arrives (works for both WebLN and manual) */}
      {isReceiptDialogOpen && receipt && (
        <Dialog
          open={isReceiptDialogOpen}
          onOpenChange={(open) => {
            setIsReceiptDialogOpen(open);
            if (!open) {
              // Reset all dialog states when receipt dialog is closed
              setShowInvoice(false);
              setIsWaitingForReceipt(false);
              setReceipt(null);
              // Reset form
              setSelectedAmount(null);
              setCustomAmount("");
              setComment("");
            }
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Zap Gönderildi</DialogTitle>
              <DialogDescription>Zap başarıyla gönderildi.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Miktar:</span>
                  <span className="font-semibold text-orange-700">{receipt.amount} sats</span>
                </div>
                {receipt.comment && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">Mesaj:</span> {receipt.comment}
                  </div>
                )}
              </div>

              {/* Close button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setIsReceiptDialogOpen(false)}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  Tamam
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
});
