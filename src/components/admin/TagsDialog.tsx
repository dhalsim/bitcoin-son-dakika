import { useState } from "react";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

import AdminTags from "./AdminTags";
import { postAdminAction } from "./utils";

interface TagsDialogProps {
  onTagsUpdated?: () => void;
}

export default function TagsDialog({ onTagsUpdated }: TagsDialogProps) {
  const [open, setOpen] = useState(false);
  const { getPublicKey, signEvent } = useNostrAuth();

  const handleperformPublishAction = async (data: any) => {
    try {
      const result = await postAdminAction(data, getPublicKey, signEvent);

      // Call the callback to refresh tags in parent components
      if (onTagsUpdated) {
        onTagsUpdated();
      }

      return result;
    } catch (error) {
      console.error("Error performing admin action:", error);
      throw error;
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // If dialog is closing and we have a callback, trigger it
    if (!newOpen && onTagsUpdated) {
      onTagsUpdated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" title="Etiketleri Yönet">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Etiket Yönetimi</DialogTitle>
          <DialogDescription>
            Haber, Makale ve Podcast için kullanılabilir etiketleri yönetin. Burada yaptığınız
            değişiklikler tüm içerik türlerinde kullanılabilir olacaktır.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <AdminTags performPublishAction={handleperformPublishAction} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
