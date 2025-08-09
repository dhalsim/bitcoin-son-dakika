import { Loader2, Rocket } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import CanvasEditor, { type CanvasEditorHandle } from "@/components/CanvasEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type UploadToXProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialTitle?: string;
  initialSummary?: string;
  initialImage?: string;
  initialContent?: string;
  onUpload: (blob: Blob) => Promise<void> | void;
  width?: number;
  height?: number;
};

export default function UploadToX({
  open,
  onOpenChange,
  initialTitle = "",
  initialSummary = "",
  initialImage = "",
  initialContent = "",
  onUpload,
  width = 800,
  height = 600,
}: UploadToXProps) {
  const canvasRef = useRef<CanvasEditorHandle | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [imageUrl, setImageUrl] = useState(initialImage);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setSummary(initialSummary);
      setImageUrl(initialImage);
      setContent(initialContent);
    }
  }, [open, initialTitle, initialSummary, initialImage, initialContent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>X'e Yükle</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <Label>Başlık</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Özet</Label>
              <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
            <div>
              <Label>Görsel URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
            </div>
            <div>
              <Label>İçerik</Label>
              <Textarea
                className="min-h-[160px]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <Button
              disabled={loading || !imageUrl.trim()}
              onClick={async () => {
                if (!canvasRef.current) {
                  return;
                }

                setLoading(true);
                try {
                  const blob = await canvasRef.current.exportAsBlob();
                  if (!blob) {
                    return;
                  }

                  await onUpload(blob);
                  onOpenChange(false);
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  X'e Yükle
                </>
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <CanvasEditor
              ref={canvasRef as any}
              imageUrl={imageUrl}
              captionText={title}
              width={width}
              height={height}
              backgroundColor="#000000"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
