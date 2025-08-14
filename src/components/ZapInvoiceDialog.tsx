import { Copy } from "lucide-react";
import { toString as toSvgString } from "qrcode/lib/browser.js";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ZapInvoiceDialogProps {
  invoice: string;
  amount: number;
  comment?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ZapInvoiceDialog({
  invoice,
  amount,
  comment,
  open,
  onOpenChange,
}: ZapInvoiceDialogProps) {
  const [qrSvg, setQrSvg] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsLoading(true);
        const svg = await toSvgString(invoice, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrSvg(svg);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        toast({
          title: "Hata",
          description: "QR kod oluşturulamadı",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (open && invoice) {
      generateQR();
    }
  }, [open, invoice, toast]);

  // Receipt listening moved to parent

  const copyInvoice = async () => {
    try {
      await navigator.clipboard.writeText(invoice);
      toast({
        title: "Kopyalandı",
        description: "Fatura kopyalandı",
      });
    } catch (error) {
      console.error("Failed to copy invoice:", error);
      toast({
        title: "Hata",
        description: "Fatura kopyalanamadı",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zap Faturası</DialogTitle>
          <DialogDescription>
            Lightning Network üzerinden ödeme yapmak için faturayı kullanın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Amount and comment summary */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Miktar:</span>
              <span className="font-semibold text-orange-700">{amount} sats</span>
            </div>
            {comment && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">Mesaj:</span> {comment}
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            <div className="border border-gray-200 rounded-lg p-4 bg-white">
              {isLoading ? (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  className="w-[200px] h-[200px] flex justify-center items-center"
                />
              )}
            </div>
          </div>

          {/* Invoice text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Fatura:</label>
            <div className="relative">
              <textarea
                value={invoice}
                readOnly
                className="w-full h-20 p-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded resize-none"
                placeholder="Fatura yükleniyor..."
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-2">
            <Button variant="outline" className="flex-1" onClick={copyInvoice}>
              <Copy className="h-4 w-4 mr-1" />
              Kopyala
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>1. QR kodu Lightning cüzdanınızla tarayın</p>
            <p>2. Veya faturayı kopyalayıp cüzdanınıza yapıştırın</p>
            <p>3. Ödeme tamamlandığında zap otomatik olarak görünecek</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
