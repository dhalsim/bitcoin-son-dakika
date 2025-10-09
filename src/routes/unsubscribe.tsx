import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

import Header from "../components/Header";
import Footer from "../components/Footer";

interface UnsubscribeResponse {
  success: boolean;
  message: string;
  email?: string;
  unsubscribed?: boolean;
  alreadyUnsubscribed?: boolean;
}

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<UnsubscribeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("Geçersiz unsubscribe linki");
      setLoading(false);
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch(`/api/email-subscription?token=${encodeURIComponent(token)}`);

        const data: UnsubscribeResponse = await response.json();

        if (data.success) {
          setResult(data);
        } else {
          setError(data.message || "Bir hata oluştu");
        }
      } catch (err) {
        setError("Bir hata oluştu. Lütfen tekrar deneyiniz.");
      } finally {
        setLoading(false);
      }
    };

    unsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                {loading ? (
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : error ? (
                  <span className="text-2xl">❌</span>
                ) : result?.alreadyUnsubscribed ? (
                  <span className="text-2xl">ℹ️</span>
                ) : (
                  <span className="text-2xl">✅</span>
                )}
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {loading ? "İşleniyor..." : error ? "Hata" : "Abonelikten Çıkma"}
              </h1>
            </div>

            {loading && (
              <p className="text-gray-600 dark:text-gray-300">Abonelikten çıkarılıyorsunuz...</p>
            )}

            {error && (
              <div className="space-y-4">
                <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Sorun devam ederse, lütfen bizimle iletişime geçin.
                </p>
              </div>
            )}

            {result && !error && (
              <div className="space-y-4">
                <p
                  className={`font-medium ${
                    result.alreadyUnsubscribed
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-green-600 dark:text-green-400"
                  }`}
                >
                  {result.message}
                </p>

                {result.email && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    E-posta: <span className="font-mono">{result.email}</span>
                  </p>
                )}

                {result.unsubscribed && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Artık Bitcoin Son Dakika e-posta bildirimlerini almayacaksınız. İstediğiniz
                      zaman tekrar abone olabilirsiniz.
                    </p>
                  </div>
                )}

                {result.alreadyUnsubscribed && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      Bu e-posta adresi zaten abonelikten çıkarılmış durumda.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-200"
              >
                Ana Sayfaya Dön
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
