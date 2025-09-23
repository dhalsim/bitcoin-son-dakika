import React, { useState } from "react";
import {
  Download,
  Globe,
  Shield,
  Smartphone,
  Monitor,
  Apple,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginResult } from "@/contexts/NostrAuthContext";

// Custom SVG Icons from Simple Icons
const ChromeIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    role="img"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Google Chrome</title>
    <path d="M12 0C8.21 0 4.831 1.757 2.632 4.501l3.953 6.848A5.454 5.454 0 0 1 12 6.545h10.691A12 12 0 0 0 12 0zM1.931 5.47A11.943 11.943 0 0 0 0 12c0 6.012 4.42 10.991 10.189 11.864l3.953-6.847a5.45 5.45 0 0 1-6.865-2.29zm13.342 2.166a5.446 5.446 0 0 1 1.45 7.09l.002.001h-.002l-5.344 9.257c.206.01.413.016.621.016 6.627 0 12-5.373 12-12 0-1.54-.29-3.011-.818-4.364zM12 16.364a4.364 4.364 0 1 1 0-8.728 4.364 4.364 0 0 1 0 8.728Z" />
  </svg>
);

const FirefoxIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    role="img"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Firefox Browser</title>
    <path d="M8.824 7.287c.008 0 .004 0 0 0zm-2.8-1.4c.006 0 .003 0 0 0zm16.754 2.161c-.505-1.215-1.53-2.528-2.333-2.943.654 1.283 1.033 2.57 1.177 3.53l.002.02c-1.314-3.278-3.544-4.6-5.366-7.477-.091-.147-.184-.292-.273-.446a3.545 3.545 0 01-.13-.24 2.118 2.118 0 01-.172-.46.03.03 0 00-.027-.03.038.038 0 00-.021 0l-.006.001a.037.037 0 00-.01.005L15.624 0c-2.585 1.515-3.657 4.168-3.932 5.856a6.197 6.197 0 00-2.305.587.297.297 0 00-.147.37c.057.162.24.24.396.17a5.622 5.622 0 012.008-.523l.067-.005a5.847 5.847 0 011.957.222l.095.03a5.816 5.816 0 01.616.228c.08.036.16.073.238.112l.107.055a5.835 5.835 0 01.368.211 5.953 5.953 0 012.034 2.104c-.62-.437-1.733-.868-2.803-.681 4.183 2.09 3.06 9.292-2.737 9.02a5.164 5.164 0 01-1.513-.292 4.42 4.42 0 01-.538-.232c-1.42-.735-2.593-2.121-2.74-3.806 0 0 .537-2 3.845-2 .357 0 1.38-.998 1.398-1.287-.005-.095-2.029-.9-2.817-1.677-.422-.416-.622-.616-.8-.767a3.47 3.47 0 00-.301-.227 5.388 5.388 0 01-.032-2.842c-1.195.544-2.124 1.403-2.8 2.163h-.006c-.46-.584-.428-2.51-.402-2.913-.006-.025-.343.176-.389.206-.406.29-.787.616-1.136.974-.397.403-.76.839-1.085 1.303a9.816 9.816 0 00-1.562 3.52c-.003.013-.11.487-.19 1.073-.013.09-.026.181-.037.272a7.8 7.8 0 00-.069.667l-.002.034-.023.387-.001.06C.386 18.795 5.593 24 12.016 24c5.752 0 10.527-4.176 11.463-9.661.02-.149.035-.298.052-.448.232-1.994-.025-4.09-.753-5.844z" />
  </svg>
);

const AndroidIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg
    role="img"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Android</title>
    <path d="M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z" />
  </svg>
);

interface SignupFormProps {
  onSuccess: (result: LoginResult) => void;
  onError: (errorMessage: string) => void;
}

type Platform = "desktop" | "mobile";
type DesktopBrowser = "chrome" | "firefox";
type MobileOS = "android" | "ios";

interface ClientOption {
  id: string;
  name: string;
  description: string;
  icon: any;
  url: string;
  instructions: string[];
  features: string[];
  recommended?: boolean;
}

export function SignupForm({ onSuccess, onError }: SignupFormProps) {
  const [step, setStep] = useState<"platform" | "browser" | "client">("platform");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [selectedBrowser, setSelectedBrowser] = useState<DesktopBrowser | null>(null);
  const [selectedOS, setSelectedOS] = useState<MobileOS | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);

  // Platform detection
  const detectPlatform = (): { platform: Platform; browser?: DesktopBrowser; os?: MobileOS } => {
    if (typeof window === "undefined") {
      return { platform: "desktop" };
    }

    const userAgent = navigator.userAgent.toLowerCase();

    // Check if mobile
    if (/android|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent)) {
      if (/android/i.test(userAgent)) {
        return { platform: "mobile", os: "android" };
      } else if (/iphone|ipad|ipod/i.test(userAgent)) {
        return { platform: "mobile", os: "ios" };
      }
      return { platform: "mobile", os: "android" }; // fallback
    }

    // Desktop browser detection
    if (/chrome|chromium|edge|opera/i.test(userAgent)) {
      return { platform: "desktop", browser: "chrome" };
    } else if (/firefox/i.test(userAgent)) {
      return { platform: "desktop", browser: "firefox" };
    }

    return { platform: "desktop", browser: "chrome" }; // fallback
  };

  // Auto-detect on mount
  React.useEffect(() => {
    const detected = detectPlatform();
    setSelectedPlatform(detected.platform);

    if (detected.platform === "desktop" && detected.browser) {
      setSelectedBrowser(detected.browser);
      setStep("client");
    } else if (detected.platform === "mobile" && detected.os) {
      setSelectedOS(detected.os);
      setStep("client");
    }
  }, []);

  const handleBackToLogin = () => {
    onError(""); // Clear any errors
  };

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
    setStep("browser");
  };

  const handleBrowserSelect = (browser: DesktopBrowser) => {
    setSelectedBrowser(browser);
    setStep("client");
  };

  const handleOSSelect = (os: MobileOS) => {
    setSelectedOS(os);
    setStep("client");
  };

  const handleClientSelect = (client: ClientOption) => {
    setSelectedClient(client);
  };

  const handleBack = () => {
    if (step === "client") {
      setStep("browser");
      setSelectedClient(null);
    } else if (step === "browser") {
      setStep("platform");
      setSelectedBrowser(null);
      setSelectedOS(null);
    }
  };

  const getClientOptions = (): ClientOption[] => {
    if (selectedPlatform === "desktop") {
      if (selectedBrowser === "chrome") {
        return [
          {
            id: "nos2x",
            name: "nos2x",
            description: "Nostr için özel olarak tasarlanmış tarayıcı eklentisi",
            icon: Shield,
            url: "https://github.com/fiatjaf/nos2x",
            instructions: [
              "Chrome Web Store'dan nos2x eklentisini indirin",
              "Eklentiyi yükleyin ve açın",
              "Yeni anahtar çifti oluşturun",
              "bitcoinsondakika.com'a geri dönün ve giriş yapın",
            ],
            features: ["Nostr odaklı", "Açık kaynak", "Hafif"],
            recommended: true,
          },
          {
            id: "alby",
            name: "Alby",
            description: "Bitcoin Lightning cüzdanı ve Nostr anahtarı yöneticisi",
            icon: Download,
            url: "https://getalby.com/",
            instructions: [
              "Chrome Web Store'dan Alby eklentisini indirin",
              "Eklentiyi yükleyin ve açın",
              "Yeni hesap oluşturun veya mevcut hesabınızı içe aktarın",
              "bitcoinsondakika.com'a geri dönün ve giriş yapın",
            ],
            features: ["Bitcoin Lightning desteği", "Güvenli anahtar yönetimi", "Kolay kullanım"],
          },
        ];
      } else if (selectedBrowser === "firefox") {
        return [
          {
            id: "nos2x-firefox",
            name: "nos2x (Firefox)",
            description: "Firefox için nos2x eklentisi",
            icon: Shield,
            url: "https://addons.mozilla.org/en-US/firefox/addon/nos2x-fox/",
            instructions: [
              "Firefox Add-ons'dan nos2x eklentisini indirin",
              "Eklentiyi yükleyin ve açın",
              "Yeni anahtar çifti oluşturun",
              "bitcoinsondakika.com'a geri dönün ve giriş yapın",
            ],
            features: ["Nostr odaklı", "Açık kaynak", "Hafif"],
            recommended: true,
          },
          {
            id: "alby",
            name: "Alby (Firefox)",
            description: "Firefox için Alby eklentisi",
            icon: Download,
            url: "https://addons.mozilla.org/en-US/firefox/addon/alby/",
            instructions: [
              "Firefox Add-ons'dan Alby eklentisini indirin",
              "Eklentiyi yükleyin ve açın",
              "Yeni hesap oluşturun veya mevcut hesabınızı içe aktarın",
              "bitcoinsondakika.com'a geri dönün ve giriş yapın",
            ],
            features: ["Bitcoin Lightning desteği", "Firefox uyumlu", "Güvenli"],
            recommended: true,
          },
        ];
      }
    } else if (selectedPlatform === "mobile") {
      if (selectedOS === "android") {
        return [
          {
            id: "amber",
            name: "Amber",
            description: "Android için Nostr imzacısı",
            icon: Smartphone,
            url: "https://github.com/greenart7c3/Amber",
            instructions: [
              "Zapstore, Obtainium, F-Droid veya GitHub Releases'dan Amber uygulamasını indirin",
              "Uygulamayı açın ve hesap oluşturun (Generate a new key)",
              "bitcoinsondakika.com'a geri dönün ve 'Nostr ile giriş' sekmesini seçin",
              "NostrConnect seçin ve QR koda tıklayın",
            ],
            features: ["Android optimizasyonu", "Kolay kullanım", "Güvenli"],
            recommended: true,
          },
          {
            id: "Quetta Tarayıcı",
            name: "Quetta Tarayıcı",
            description: "Android için eklenti tabanlı tarayıcı",
            icon: Globe,
            url: "https://play.google.com/store/apps/details?id=net.quetta.browser",
            instructions: [
              "Quetta Tarayıcı'yı indirin",
              "Eklentilerden nos2x veya alby'yi indirin",
              "bitcoinsondakika.com'a geri dönün ve 'Nostr ile giriş' sekmesini seçin",
              "Eklenti ile giriş yap butonuna tıklayın",
            ],
            features: ["Android optimizasyonu", "Kolay kullanım", "Güvenli"],
            recommended: true,
          },
        ];
      } else if (selectedOS === "ios") {
        return [
          {
            id: "nostur",
            name: "Nostur",
            description: "iOS için Nostr istemcisi",
            icon: Apple,
            url: "https://apps.apple.com/app/nostur/id1664033346",
            instructions: [
              "App Store'dan Nostur uygulamasını indirin",
              "Uygulamayı açın ve hesap oluşturun",
              "Anahtarınızı güvenli bir yerde saklayın",
              "bitcoinsondakika.com'a geri dönün ve giriş yapın",
              "NostrConnect ile Nostr bağlantısı kurun",
            ],
            features: ["iOS optimizasyonu", "Güvenli", "Kolay kullanım"],
            recommended: true,
          },
          {
            id: "snort-ios",
            name: "Snort",
            description: "Web tabanlı Nostr istemcisi",
            icon: Globe,
            url: "https://snort.social/",
            instructions: [
              "Safari'de Snort.social web sitesini ziyaret edin",
              "Hesap oluşturun",
              "Anahtarınızı güvenli bir yerde saklayın",
              "bitcoinsondakika.com'a geri dönün ve giriş yapın",
            ],
            features: ["Web tabanlı", "Hızlı başlangıç", "Safari uyumlu"],
          },
        ];
      }
    }
    return [];
  };

  const renderPlatformSelection = () => {
    const detected = detectPlatform();

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Platformunuzu Seçin</h3>
          <p className="text-sm text-muted-foreground">
            Hangi cihazda Nostr hesabınızı oluşturmak istiyorsunuz?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              detected.platform === "desktop" ? "border-2 border-green-500" : ""
            }`}
            onClick={() => handlePlatformSelect("desktop")}
          >
            <CardHeader className="text-center pb-3">
              <Monitor className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle className="text-base flex items-center justify-center gap-2">
                Masaüstü
                {detected.platform === "desktop" && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Algılandı
                  </span>
                )}
              </CardTitle>
              <CardDescription>Bilgisayarınızda kullanın</CardDescription>
            </CardHeader>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${
              detected.platform === "mobile" ? "border-2 border-green-500" : ""
            }`}
            onClick={() => handlePlatformSelect("mobile")}
          >
            <CardHeader className="text-center pb-3">
              <Smartphone className="h-12 w-12 mx-auto mb-2 text-primary" />
              <CardTitle className="text-base flex items-center justify-center gap-2">
                Mobil
                {detected.platform === "mobile" && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Algılandı
                  </span>
                )}
              </CardTitle>
              <CardDescription>Telefonunuzda kullanın</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  };

  const renderBrowserSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Tarayıcınızı Seçin</h3>
        <p className="text-sm text-muted-foreground">Hangi tarayıcıyı kullanıyorsunuz?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => handleBrowserSelect("chrome")}
        >
          <CardHeader className="text-center pb-3">
            <ChromeIcon className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle className="text-base">Chrome / Brave / Opera</CardTitle>
            <CardDescription>Chrome tabanlı tarayıcılar</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => handleBrowserSelect("firefox")}
        >
          <CardHeader className="text-center pb-3">
            <FirefoxIcon className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle className="text-base">Firefox</CardTitle>
            <CardDescription>Firefox tarayıcısı</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );

  const renderOSSelection = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">İşletim Sisteminizi Seçin</h3>
        <p className="text-sm text-muted-foreground">Telefonunuzda hangi işletim sistemi var?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => handleOSSelect("android")}
        >
          <CardHeader className="text-center pb-3">
            <AndroidIcon className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle className="text-base">Android</CardTitle>
            <CardDescription>Android telefonlar</CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer transition-all hover:shadow-md"
          onClick={() => handleOSSelect("ios")}
        >
          <CardHeader className="text-center pb-3">
            <Apple className="h-12 w-12 mx-auto mb-2 text-primary" />
            <CardTitle className="text-base">iOS</CardTitle>
            <CardDescription>iPhone ve iPad</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );

  const renderClientSelection = () => {
    const clients = getClientOptions();

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Nostr İstemcisi Seçin</h3>
          <p className="text-sm text-muted-foreground">
            {selectedPlatform === "desktop"
              ? `Tarayıcınız otomatik olarak algılandı: ${selectedBrowser === "chrome" ? "Chrome tabanlı" : "Firefox"}`
              : `İşletim sisteminiz otomatik olarak algılandı: ${selectedOS === "android" ? "Android" : "iOS"}`}
          </p>
          <Button variant="outline" size="sm" onClick={() => setStep("platform")} className="mt-2">
            Platform Değiştir
          </Button>
        </div>

        <div className="space-y-3">
          {clients.map((client) => (
            <Card
              key={client.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedClient?.id === client.id ? "border-2 border-green-500" : ""
              }`}
              onClick={() => handleClientSelect(client)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <client.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {client.name}
                        {client.recommended && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Önerilen
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm mt-1">
                        {client.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {client.features.map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs bg-muted px-2 py-1 rounded-md flex items-center gap-1"
                      >
                        <CheckCircle className="h-3 w-3" />
                        {feature}
                      </span>
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(client.url, "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    İndir / Aç
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedClient && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Kurulum Talimatları:</h4>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              {selectedClient.instructions.map((instruction, index) => (
                <li key={index}>{instruction}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      {step !== "platform" && (
        <Button variant="ghost" size="sm" onClick={handleBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
      )}

      {/* Step Content */}
      {step === "platform" && renderPlatformSelection()}
      {step === "browser" && selectedPlatform === "desktop" && renderBrowserSelection()}
      {step === "browser" && selectedPlatform === "mobile" && renderOSSelection()}
      {step === "client" && renderClientSelection()}

      {/* Nostr Education */}
      <div className="border border-purple-200 rounded-lg p-4">
        <h4 className="font-medium mb-2">Nostr Hakkında</h4>
        <div className="text-sm space-y-2">
          <p>
            <strong>Nostr nedir?</strong> Nostr, merkezi olmayan sosyal medya protokolüdür.
            Hesabınızı bir kez oluşturduktan sonra tüm Nostr uygulamalarında kullanabilirsiniz.
          </p>
          <p>
            <strong>Nasıl çalışır?</strong> bitcoinsondakika.com sadece bir Nostr istemcisidir.
            Hesabınızı oluşturduktan sonra Snort, Amethyst, Damus gibi diğer istemcilerde de aynı
            hesabı kullanabilirsiniz.
          </p>
          <p>
            <strong>Güvenlik:</strong> Anahtarınızı güvenli bir yerde saklayın. Bu anahtar
            hesabınızın kontrolünü sağlar.
          </p>
        </div>
      </div>

      {/* Back to Login */}
      <div className="text-center">
        <Button variant="outline" onClick={handleBackToLogin}>
          Zaten hesabım var, giriş yapmak istiyorum
        </Button>
      </div>
    </div>
  );
}
