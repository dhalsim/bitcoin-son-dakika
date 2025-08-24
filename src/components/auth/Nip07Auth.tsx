import { useState } from "react";
import { Key, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { isNip07Available } from "@/lib/providers/Nip07Provider";

interface Nip07AuthProps {
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

export function Nip07Auth({ onSuccess, onError }: Nip07AuthProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithNip07 } = useNostrAuth();
  const { toast } = useToast();

  const handleNip07Login = async () => {
    if (!isNip07Available()) {
      onError("NIP-07 eklentisi bulunamadı. Lütfen yükleyin.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginWithNip07();

      if (result.success) {
        // Login successful, notify parent
        setIsLoading(false);
        onSuccess(result);

        // Show success toast
        toast({
          title: "Bağlantı Başarılı!",
          description: "NIP-07 ile bağlantı kuruldu",
        });
      } else {
        onError("Giriş başarısız. Lütfen tekrar deneyin.");
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata oluştu";
      onError(errorMessage);
      setIsLoading(false);
    }
  };

  if (!isNip07Available()) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          NIP-07 eklentisi bulunamadı. Lütfen{" "}
          <a
            href="https://github.com/aljazceru/awesome-nostr#nip-07-browser-extensions"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            NIP-07 uyumlu bir eklenti
          </a>{" "}
          yükleyin.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Key className="h-4 w-4" />
        Tarayıcı eklentisi ile tek tıkla giriş yapın
      </div>

      <Button onClick={handleNip07Login} disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Giriş yapılıyor...
          </>
        ) : (
          "Eklenti ile Giriş Yap"
        )}
      </Button>
    </div>
  );
}
