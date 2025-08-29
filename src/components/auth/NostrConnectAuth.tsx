import { useEffect, useState } from "react";
import { Relay } from "nostr-tools";
import { QrCode, Copy, RefreshCw, Smartphone, Hand, Info, Settings } from "lucide-react";
import { toString as toSvgString } from "qrcode/lib/browser.js";

import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import {
  decryptContent,
  generateNostrConnectUri,
  NostrConnectData,
} from "@/lib/providers/NostrConnectProvider";
import { hexToBytes } from "nostr-tools/utils";
import { isMobile } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface NostrConnectAuthProps {
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
}

export function NostrConnectAuth({ onSuccess, onError }: NostrConnectAuthProps) {
  const [generatedUri, setGeneratedUri] = useState("");
  const [qrSvg, setQrSvg] = useState("");
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [relay, setRelay] = useState("wss://relay.nsec.app");
  const [isWaitingForConnection, setIsWaitingForConnection] = useState(false);
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);
  const [showCopiedTooltip2, setShowCopiedTooltip2] = useState(false);
  const [showCopiedTooltip3, setShowCopiedTooltip3] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  // New state variables for UI control
  const [showRelayInput, setShowRelayInput] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const { loginWithNostrConnect } = useNostrAuth();
  const { toast } = useToast();

  const copyTooltip = (
    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded whitespace-nowrap z-tooltip">
      Kopyalandı
    </span>
  );

  // Generate initial QR code on mount
  useEffect(() => {
    if (relay) {
      generateInitialQRCode();
    }
  }, []);

  // Scroll to QR when component mounts
  useEffect(() => {
    if (generatedUri) {
      setTimeout(() => {
        const tabContent = document.querySelector('[data-value="nostrconnect"]');
        if (tabContent) {
          tabContent.scrollTop = tabContent.scrollHeight;
        }
      }, 100);
    }
  }, [generatedUri]);

  const generateInitialQRCode = async () => {
    const { uri, ephemeralData } = generateNostrConnectUri(relay);
    setGeneratedUri(uri);
    await generateQRCode(uri);
    setIsWaitingForConnection(true);
    onError(null);

    // Start initial connection
    const sub = await handleNostrConnection(ephemeralData);
    setCurrentSubscription(sub);
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

  const copyOrOpenUri = async (no: 1 | 2 | 3) => {
    if (isMobile()) {
      window.open(generatedUri, "_blank");

      return;
    }

    try {
      await navigator.clipboard.writeText(generatedUri);

      if (no === 1) {
        setShowCopiedTooltip(true);

        setTimeout(() => setShowCopiedTooltip(false), 2000);
      } else if (no === 2) {
        setShowCopiedTooltip2(true);

        setTimeout(() => setShowCopiedTooltip2(false), 2000);
      } else {
        setShowCopiedTooltip3(true);

        setTimeout(() => setShowCopiedTooltip3(false), 2000);
      }
    } catch (error) {
      console.error("Failed to copy URI:", error);

      toast({
        title: "Hata",
        description: "URI kopyalanamadı",
        variant: "destructive",
      });
    }
  };

  const handleRelayChange = (newRelay: string) => {
    setRelay(newRelay);
    setIsTyping(true);

    // Clear current QR code and show placeholder
    setQrSvg("");
    setIsWaitingForConnection(false);

    // Close current subscription if exists
    if (currentSubscription) {
      currentSubscription.close();
      setCurrentSubscription(null);
    }
  };

  const handleRefresh = async () => {
    setIsTyping(false);

    // Close current subscription if exists
    if (currentSubscription) {
      currentSubscription.close();

      setCurrentSubscription(null);
    }

    const { uri, ephemeralData } = generateNostrConnectUri(relay);

    setGeneratedUri(uri);

    await generateQRCode(uri);

    setIsWaitingForConnection(true);
    onError(null);

    // Start new connection
    const sub = await handleNostrConnection(ephemeralData);

    setCurrentSubscription(sub);
  };

  const handleNostrConnection = async (ephemeralData: NostrConnectData) => {
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

          const ephemeralSecret = hexToBytes(ephemeralData.ephemeralSecret);

          const decryptedSecret = decryptContent(evt.content, evt.pubkey, ephemeralSecret);

          if (!decryptedSecret) {
            onError("Şifreleme formatı tanınmadı");

            return;
          }

          // Parse the decrypted JSON content to extract the actual secret
          let responseData: { id: string; result: string } = JSON.parse(decryptedSecret);

          try {
            responseData = JSON.parse(decryptedSecret);
          } catch (parseError) {
            console.error("Failed to parse decrypted JSON:", parseError);

            onError("Yanıt formatı geçersiz - JSON parse hatası");

            return;
          }

          // Extract the actual secret from the result field
          const responseSecret = responseData.result;

          // Compare with our connection secret
          if (responseSecret !== ephemeralData.connectionSecret) {
            onError("Connection secret eşleşmiyor");

            return;
          }

          ephemeralData.remoteSignerPubkey = evt.pubkey;

          loginWithNostrConnect(ephemeralData).then((result) => {
            if (result.success) {
              toast({
                title: "Bağlantı Başarılı!",
                description: "NostrConnect ile bağlantı kuruldu",
              });

              // Close relay connection after successful connection
              if (sub) {
                sub.close();
              }

              onSuccess(result);
            } else {
              onError("Giriş başarısız. Lütfen tekrar deneyin.");
            }
          });
        },
      },
    );

    return sub;
  };

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (currentSubscription) {
        currentSubscription.close();
      }
    };
  }, [currentSubscription]);

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="space-y-4">
        {/* QR Code or Placeholder */}
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="border border-2 border-gray-200 hover:border-red-700 rounded-lg p-4 bg-white mt-2">
              {isQrLoading ? (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : isTyping ? (
                <div className="w-[200px] h-[200px] flex flex-col items-center justify-center text-center text-muted-foreground">
                  <p className="text-sm">
                    <QrCode className="h-12 w-12 mb-2 opacity-50" />
                  </p>
                </div>
              ) : qrSvg ? (
                <div className="relative cursor-pointer">
                  <div
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                    className="w-[200px] h-[200px] flex justify-center items-center"
                    onClick={() => copyOrOpenUri(2)}
                  />
                  {showCopiedTooltip2 && copyTooltip}
                </div>
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Connection Status */}
          {isWaitingForConnection && !isTyping && (
            <div className="text-center py-2">
              <div className="flex flex-col items-center gap-2 text-sm text-orange-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span>Bağlantı bekleniyor...</span>{" "}
                <span className="flex items-center gap-2">
                  QR kodu tarayın veya kopyalamak için üzerine tıklayın <Hand className="h-4 w-4" />
                </span>
              </div>
            </div>
          )}

          {/* Typing Status */}
          {isTyping && (
            <div className="text-center py-2">
              <div className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-3 py-2 rounded-md">
                Relay değiştirildi - QR kodu güncellemek için "Yenile" butonuna tıklayın
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setShowRelayInput(!showRelayInput)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showRelayInput ? "Ayarları Gizle" : "Ayarlar"}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Yardım
              </Button>
            </SheetTrigger>
            <SheetContent style={{ zIndex: "var(--z-dialog-sheet)" }}>
              <SheetHeader>
                <SheetTitle>NostrConnect Kullanım Kılavuzu (WIP)</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">📱 Uygulama İndirme</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      <strong>iOS:</strong> App Store'dan "NostrConnect" veya "Amethyst"
                      uygulamasını indirin
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Android:</strong> Google Play'den "NostrConnect" veya "Amethyst"
                      uygulamasını indirin
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Alternatif:</strong> F-Droid'dan "Amethyst" uygulamasını indirin
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">🔗 Bağlantı Kurma</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>1. QR kodu mobil cihazınızla tarayın veya üzerine tıklayın</p>
                    <p>2. Mobil cihazınızda NostrConnect uygulamasını açın</p>
                    <p>3. İzin verin ve bağlantı otomatik olarak oluşturulacaktır</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">⚙️ Gelişmiş Ayarlar</h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Relay URL'yi değiştirmek için "Ayarlar" butonuna tıklayın</p>
                    <p>• Farklı relay'ler kullanarak bağlantı hızını artırabilirsiniz</p>
                    <p>• Varsayılan relay: wss://relay.nsec.app</p>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Relay Input - Conditionally Shown */}
        {showRelayInput && (
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
                className="flex-1 px-3 py-2 border rounded-md bg-background text-sm focus:border-white"
              />
              <Button
                onClick={handleRefresh}
                variant={isTyping ? "default" : "outline"}
                size="sm"
                className={`px-3 ${isTyping ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}`}
              >
                <RefreshCw className={`h-4 w-4 ${isTyping ? "animate-pulse" : ""}`} />
                Yenile
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
