import { useEffect, useState } from "react";
import { Relay, nip44, nip04 } from "nostr-tools";
import { Key, Smartphone, QrCode, AlertTriangle, Copy, RefreshCw } from "lucide-react";
import { toString as toSvgString } from "qrcode/lib/browser.js";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AuthIntent, LoginResult, useNostrAuth } from "@/contexts/NostrAuthContext";
import { isNip07Available } from "@/lib/providers/Nip07Provider";
import { createKeyPair } from "@/lib/utils";
import { NostrConnectData } from "@/lib/providers/NostrConnectProvider";

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
  const [generatedUri, setGeneratedUri] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [relay, setRelay] = useState("wss://relay.nsec.app");
  const [isWaitingForConnection, setIsWaitingForConnection] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

  const { loginWithNip07, loginWithNostrConnect } = useNostrAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!relay) {
      return;
    }

    handleRelayChange(relay);
  }, [relay, open]);

  // Scroll to QR when NostrConnect tab is selected
  useEffect(() => {
    if (activeTab === "nostrconnect" && generatedUri) {
      setTimeout(() => {
        const tabContent = document.querySelector('[data-value="nostrconnect"]');
        if (tabContent) {
          tabContent.scrollTop = tabContent.scrollHeight;
        }
      }, 100);
    }
  }, [activeTab, generatedUri]);

  const generateNostrConnectUri = (relay: string) => {
    const keyPair = createKeyPair();

    // Generate a random secret for connection spoofing protection
    const connectionSecret = generateRandomSecret();

    // Build the URI according to NIP-46 specification
    const params = new URLSearchParams({
      relay: relay,
      secret: connectionSecret,
      perms: "sign_event,get_public_key",
      name: "bitcoinsondakika.com",
      url: window.location.origin,
    });

    const uri = `nostrconnect://${keyPair.pubkey}?${params.toString()}`;

    // Store the key pair with connection secret for later validation
    const ephemeralData: NostrConnectData = {
      relay: relay,
      uri: uri,
      ephemeralSecret: keyPair.secret,
      ephemeralPubkey: keyPair.pubkey,
      timestamp: Math.floor(Date.now() / 1000),
      connectionSecret: connectionSecret,
      remoteSignerPubkey: null,
    };

    setGeneratedUri(uri);

    return { uri, ephemeralData };
  };

  const generateRandomSecret = () => {
    // Generate a short random string for the secret (8-12 characters)
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  };

  const generateQRCode = async (uri: string) => {
    try {
      setIsQrLoading(true);

      const svg = await toSvgString(uri, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrSvg(svg);

      // Scroll to bottom to focus on QR code
      setTimeout(() => {
        const tabContent = document.querySelector('[data-value="nostrconnect"]');
        if (tabContent) {
          tabContent.scrollTop = tabContent.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Failed to generate QR code:", error);

      toast({
        title: "Hata",
        description: "QR kod oluşturulamadı",
        variant: "destructive",
      });
    } finally {
      setIsQrLoading(false);
    }
  };

  const copyUri = async () => {
    try {
      await navigator.clipboard.writeText(generatedUri);
      setShowCopiedTooltip(true);
      setTimeout(() => setShowCopiedTooltip(false), 2000);
    } catch (error) {
      console.error("Failed to copy URI:", error);
      toast({
        title: "Hata",
        description: "URI kopyalanamadı",
        variant: "destructive",
      });
    }
  };

  const handleRelayChange = (relay: string) => {
    setRelay(relay);

    const { uri, ephemeralData } = generateNostrConnectUri(relay);

    generateQRCode(uri);

    handleConnectResponse(ephemeralData);
  };

  const handleConnectResponse = async (ephemeralData: NostrConnectData) => {
    setIsWaitingForConnection(true);
    setError(null);

    const r = new Relay(ephemeralData.relay);
    await r.connect();

    const sub = r.subscribe(
      [
        {
          kinds: [24133],
          "#p": [ephemeralData.ephemeralPubkey],
          since: ephemeralData.timestamp,
          limit: 1,
        },
      ],
      {
        onevent(evt) {
          console.log("Received connect response:", evt);

          let decryptedSecret: string | null = null;

          // Smart detection: Check if it's NIP-04 format (contains ?iv=)
          if (evt.content.includes("?iv=")) {
            console.log("Detected NIP-04 format, decrypting directly...");

            try {
              decryptedSecret = nip04.decrypt(
                ephemeralData.ephemeralSecret,
                evt.pubkey,
                evt.content,
              );
            } catch (nip04Error) {
              console.error("NIP-04 decryption failed:", nip04Error);

              setError("NIP-04 şifre çözme hatası");

              return;
            }
          } else {
            // Try NIP-44 first (standard for NIP-46)
            try {
              decryptedSecret = nip44.decrypt(evt.content, ephemeralData.ephemeralSecret);
            } catch (error) {
              console.log("NIP-44 failed, content doesn't look like NIP-04 either:", error);

              setError("Şifreleme formatı tanınmadı");

              return;
            }
          }

          console.log("Decrypted secret:", decryptedSecret);

          // Parse the decrypted JSON content to extract the actual secret
          let responseData: { id: string; result: string } | null = null;

          try {
            responseData = JSON.parse(decryptedSecret);
          } catch (parseError) {
            console.error("Failed to parse decrypted JSON:", parseError);
            setError("Yanıt formatı geçersiz - JSON parse hatası");
            return;
          }

          // Extract the actual secret from the result field
          const actualSecret = responseData.result;

          // Compare with our connection secret
          if (actualSecret !== ephemeralData.connectionSecret) {
            setError("Connection secret eşleşmiyor");

            return;
          }

          console.log("Remote signer pubkey:", evt.pubkey);

          ephemeralData.remoteSignerPubkey = evt.pubkey;

          // Show success toast
          toast({
            title: "Bağlantı Başarılı!",
            description: "NostrConnect ile bağlantı kuruldu",
          });

          // Close modal with success
          onClose({ success: true, provider: null });

          // Close relay connection after successful connection
          if (sub) {
            sub.close();
          }
        },
      },
    );

    return sub;
  };

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

  const handleNostrConnectLogin = async (ephemeralData: NostrConnectData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithNostrConnect(ephemeralData);

      if (result.success) {
        // Login successful, close modal with provider
        setIsLoading(false);
        onClose(result);
      } else {
        setError("Giriş başarısız. Lütfen tekrar deneyin.");
        setIsLoading(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata oluştu";

      // Provide more specific error messages for common NostrConnect issues
      if (errorMessage.includes("not ready")) {
        setError("NostrConnect bağlantısı kurulamadı. URI'yi kontrol edin ve tekrar deneyin.");
      } else if (errorMessage.includes("Invalid NostrConnect URI")) {
        setError("Geçersiz NostrConnect URI formatı. Lütfen doğru formatı kullanın.");
      } else {
        setError(errorMessage);
      }

      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose({ success: false, provider: null });
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setError(null);

    // Clear generated URI when switching away from NostrConnect
    if (value !== "nostrconnect") {
      setGeneratedUri("");
      setQrSvg("");
    }

    // Focus on the URI input when switching to NostrConnect tab
    if (value === "nostrconnect") {
      setTimeout(() => {
        const uriInput = document.getElementById("nostrconnect-uri");
        if (uriInput) {
          uriInput.focus();
        }
      }, 100);
    }
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
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="nip07" className="text-xs">
                Eklenti (NIP-07)
              </TabsTrigger>
              <TabsTrigger value="nostrconnect" className="text-xs">
                NostrConnect
              </TabsTrigger>
              <TabsTrigger value="nsec" disabled className="text-xs">
                Nsec
              </TabsTrigger>
              <TabsTrigger value="nip46" disabled className="text-xs">
                Bunker (NIP-46)
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
            <TabsContent value="nostrconnect" className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <QrCode className="h-4 w-4" />
                  NostrConnect URI ile cihaz eşleştirme
                </div>

                {/* QR Code - Moved to top for better focus */}
                {generatedUri && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">QR Kod:</label>
                    <div className="flex justify-center">
                      <div className="border border-gray-200 rounded-lg p-4 bg-white">
                        {isQrLoading ? (
                          <div className="w-[200px] h-[200px] flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                          </div>
                        ) : (
                          <div
                            dangerouslySetInnerHTML={{ __html: qrSvg }}
                            className="w-[200px] h-[200px] flex justify-center items-center"
                          />
                        )}
                      </div>
                    </div>

                    {/* Connection Status */}
                    {isWaitingForConnection && (
                      <div className="text-center py-2">
                        <div className="inline-flex items-center gap-2 text-sm text-orange-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                          Bağlantı bekleniyor... QR kodu tarayın
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Relay Input - Moved below QR */}
                <div className="space-y-2">
                  <label htmlFor="nostrconnect-relay" className="text-sm font-medium">
                    Relay URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="nostrconnect-relay"
                      type="text"
                      placeholder="wss://relay.nsec.app"
                      value={relay}
                      onChange={(e) => handleRelayChange(e.target.value)}
                      className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={() => handleRelayChange(relay)}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="px-3"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Yenile
                    </Button>
                  </div>
                </div>

                {/* Copy URI Button - Simplified */}
                {generatedUri && (
                  <div className="text-center">
                    <Button onClick={copyUri} variant="outline" size="sm" className="relative">
                      <Copy className="h-4 w-4 mr-2" />
                      URI'yi Kopyala
                      {showCopiedTooltip && (
                        <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                          Kopyalandı!
                        </span>
                      )}
                    </Button>
                  </div>
                )}

                {/* Instructions - Updated with clickable copy link */}
                <div className="text-xs text-muted-foreground text-center space-y-1">
                  <p>1. Relay URL'yi gerekirse değiştirin ve "Yenile" butonuna tıklayın</p>
                  <p>2. QR kodu mobil cihazınızla tarayın</p>
                  <p>
                    3. Veya{" "}
                    <button onClick={copyUri} className="underline hover:text-foreground">
                      URI'yi kopyalayın
                    </button>
                  </p>
                  <p>4. Mobil cihazınızda NostrConnect uygulamasını açın ve izin verin</p>
                  <p>5. Bağlantı otomatik olarak oluşturulacaktır</p>
                </div>
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
