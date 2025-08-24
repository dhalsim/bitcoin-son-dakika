import { useEffect, useState } from "react";
import { Relay, nip44, nip04 } from "nostr-tools";
import { QrCode, Copy, RefreshCw } from "lucide-react";
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

  const { loginWithNostrConnect } = useNostrAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!relay) {
      return;
    }

    handleRelayChange(relay);
  }, [relay]);

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

    setGeneratedUri(uri);
    generateQRCode(uri);

    setIsWaitingForConnection(true);
    onError(null);

    handleNostrConnection(ephemeralData);
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

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
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
            />
            <Button
              onClick={() => handleRelayChange(relay)}
              variant="outline"
              size="sm"
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
    </div>
  );
}
