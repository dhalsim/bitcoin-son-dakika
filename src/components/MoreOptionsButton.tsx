import { MoreVertical, Copy, ExternalLink, Key, FileText } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { EventItem } from "@/lib/nip01";
import { nip19 } from "nostr-tools";

interface MoreOptionsButtonProps {
  event: EventItem;
}

export function MoreOptionsButton({ event }: MoreOptionsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [showRawEventDialog, setShowRawEventDialog] = useState(false);
  const [showDialogCopiedTooltip, setShowDialogCopiedTooltip] = useState(false);
  const { toast } = useToast();

  const nevent = nip19.neventEncode({
    id: event.id,
    author: event.pubkey,
    kind: event.kind,
    relays: event.relays,
  });

  const { id, pubkey, created_at, content, kind, tags, sig } = event;
  const justEvent = { id, pubkey, created_at, content, kind, tags, sig };

  const handleCopyToClipboard = async (
    text: string,
    label: string,
    showDialog: boolean = false,
  ) => {
    try {
      await navigator.clipboard.writeText(text);

      setTooltipText(`${label} kopyalandı`);

      if (showDialog) {
        setShowDialogCopiedTooltip(true);
        setTimeout(() => setShowDialogCopiedTooltip(false), 2000);
      } else {
        setShowCopiedTooltip(true);
        setTimeout(() => setShowCopiedTooltip(false), 2000);
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Kopyalama başarısız",
        variant: "destructive",
      });
    }
  };

  const handleOpenWithNostrApp = () => {
    const nostrUrl = `nostr:${nevent}`;

    window.open(nostrUrl, "_blank");
  };

  const handleOpenWithNjump = () => {
    const njumpUrl = `https://njump.me/${nevent}`;

    window.open(njumpUrl, "_blank");
  };

  const handleCopyNevent = () => {
    handleCopyToClipboard(nevent, "Nevent");
  };

  const handleCopyPubkey = () => {
    handleCopyToClipboard(event.pubkey, "Açık anahtar");
  };

  const handleShowRawEvent = () => {
    setShowRawEventDialog(true);
  };

  const handleCopyRawEvent = () => {
    const { id, content, created_at, pubkey, kind, tags, sig } = event;

    const rawEvent = JSON.stringify({ id, content, created_at, pubkey, kind, tags, sig }, null, 2);

    handleCopyToClipboard(rawEvent, "Ham event verisi", true);
  };

  const menuItemClass = "!transition-none cursor-pointer whitespace-nowrap";

  return (
    <div className="relative">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-blue-400 p-2 gap-0 !transition-none"
            title="Daha fazla seçenek"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-42">
          <DropdownMenuItem onClick={handleOpenWithNostrApp} className={menuItemClass}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Nostr ile aç
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleOpenWithNjump} className={menuItemClass}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Njump ile aç
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleCopyNevent} className={menuItemClass}>
            <Copy className="mr-2 h-4 w-4" />
            Nevent kopyala
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleCopyPubkey} className={menuItemClass}>
            <Key className="mr-2 h-4 w-4" />
            Pubkey kopyala
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleShowRawEvent} className={menuItemClass}>
            <FileText className="mr-2 h-4 w-4" />
            Ham event verisi
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Tooltip */}
      {showCopiedTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-tooltip">
          {tooltipText}
          {/* Arrow pointing down */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
        </div>
      )}

      {/* Raw Event Dialog */}
      <Dialog open={showRawEventDialog} onOpenChange={setShowRawEventDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Ham Event Verisi</DialogTitle>
          </DialogHeader>

          <div className="mt-4 p-4 rounded-md border overflow-auto max-h-[60vh] relative">
            <div className="absolute top-4 right-4">
              {showDialogCopiedTooltip && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-tooltip">
                  Kopyalandı
                  {/* Arrow pointing up */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800"></div>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={handleCopyRawEvent}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <pre className="text-sm font-mono whitespace-pre-wrap">
              {JSON.stringify(justEvent, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
