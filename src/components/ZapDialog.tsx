import { Zap } from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ZapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NostrEvent;
  onZap: (event: NostrEvent, amount: number, comment?: string) => void;
}

const PRESET_AMOUNTS = [21, 50, 100, 200];

export function ZapDialog({
  open,
  onOpenChange,
  event,
  onZap,
}: ZapDialogProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [comment, setComment] = useState("");

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  const handleZap = () => {
    const amount = selectedAmount || parseInt(customAmount);
    if (amount > 0) {
      onZap(event, amount, comment.trim() || undefined);
      onOpenChange(false);
      // Reset form
      setSelectedAmount(null);
      setCustomAmount("");
      setComment("");
    }
  };

  const finalAmount = selectedAmount || parseInt(customAmount) || 0;
  const isValidAmount = finalAmount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <span>Zap Gönder</span>
          </DialogTitle>
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
              disabled={!isValidAmount}
            >
              <Zap className="h-4 w-4 mr-1" />
              Zap Gönder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
