import { useState } from "react";
import { Key, Smartphone, QrCode, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthIntent, LoginResult, useNostrAuth } from "@/contexts/NostrAuthContext";
import { isNip07Available } from "@/lib/providers/Nip07Provider";

interface LoginModalProps {
  open: boolean;
  onClose: (result: LoginResult) => void;
  intent: AuthIntent;
  reason?: string;
}

export function LoginModal({ open, onClose, intent, reason }: LoginModalProps) {
  const [activeTab, setActiveTab] = useState("nip07");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { loginWithNip07 } = useNostrAuth();

  // No more useEffect hooks - modal state is managed directly in handleNip07Login

  const handleNip07Login = async () => {
    if (!isNip07Available()) {
      setError("NIP-07 eklentisi bulunamadı. Lütfen yükleyin.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithNip07();

      if (result.success) {
        // Login successful, close modal with provider
        setIsLoading(false);
        onClose(result);
      } else {
        setError("Giriş başarısız. Lütfen tekrar deneyin.");
        setIsLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata oluştu");
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose({ success: false, provider: null });
  };

  const getReasonText = () => {
    if (reason) return reason;

    switch (intent) {
      case "read_pubkey":
        return "Kişiselleştirilmiş deneyim için genel anahtarınıza ihtiyaç var.";
      case "sign_event":
        return "Bu işlemi imzalamak için giriş yapmalısınız.";
      case "log_in":
        return "Bağlanmak için bir yöntem seçin";
      default:
        return assertUnreachable(intent);
    }
  };

  const assertUnreachable = (value: never): never => {
    throw new Error(`Unreachable code: ${value}`);
  };

  const getTitleText = () => {
    switch (intent) {
      case "read_pubkey":
        return "Giriş Gerekli";
      case "sign_event":
        return "İmzalama Gerekli";
      case "log_in":
        return "Giriş Yap";
      default:
        return assertUnreachable(intent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {getTitleText()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason */}
          <p className="text-sm text-muted-foreground">{getReasonText()}</p>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="nip07" className="text-xs">
                Eklenti (NIP-07)
              </TabsTrigger>
              <TabsTrigger value="nsec" disabled className="text-xs">
                Nsec
              </TabsTrigger>
              <TabsTrigger value="nip46" disabled className="text-xs">
                Bunker (NIP-46)
              </TabsTrigger>
              <TabsTrigger value="nostrconnect" disabled className="text-xs">
                NostrConnect
              </TabsTrigger>
            </TabsList>

            {/* NIP-07 Tab */}
            <TabsContent value="nip07" className="space-y-4">
              {isNip07Available() ? (
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
              ) : (
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
              )}
            </TabsContent>

            {/* Nsec Tab */}
            <TabsContent value="nsec" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nsec ile giriş yakında gelecek</p>
                <p className="text-xs mt-2">Gizli anahtarınızı güvenli bir şekilde saklayın</p>
              </div>
            </TabsContent>

            {/* NIP-46 Tab */}
            <TabsContent value="nip46" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Bunker (NIP-46) yakında gelecek</p>
                <p className="text-xs mt-2">Mobil cihazınızdan güvenli imzalama</p>
              </div>
            </TabsContent>

            {/* NostrConnect Tab */}
            <TabsContent value="nostrconnect" className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>NostrConnect yakında gelecek</p>
                <p className="text-xs mt-2">QR kod ile cihaz eşleştirme</p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                İptal
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
