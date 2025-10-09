import { useState } from "react";

interface EmailSubscriptionProps {
  className?: string;
}

export default function EmailSubscription({ className = "" }: EmailSubscriptionProps) {
  const [email, setEmail] = useState("");
  const [dailyChecked, setDailyChecked] = useState(false);
  const [weeklyChecked, setWeeklyChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage("Geçerli bir e-posta adresi giriniz.");
      setIsSuccess(false);
      return;
    }

    if (!dailyChecked && !weeklyChecked) {
      setMessage("Lütfen en az bir seçenek belirleyiniz (günlük veya haftalık).");
      setIsSuccess(false);
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/email-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          daily: dailyChecked,
          weekly: weeklyChecked,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("Başarıyla abone oldunuz! Teşekkürler.");
        setIsSuccess(true);
        setEmail("");
        setDailyChecked(false);
        setWeeklyChecked(false);
      } else {
        setMessage(data.message || "Bir hata oluştu. Lütfen tekrar deneyiniz.");
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage("Bir hata oluştu. Lütfen tekrar deneyiniz.");
      setIsSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`bg-info text-info-foreground p-6 rounded-lg ${className}`}>
      <div className="max-w-md mx-auto">
        <h3 className="text-lg font-semibold text-info-foreground mb-4 text-center">
          📧 E-posta Bülteni
        </h3>
        <p className="text-sm text-info-foreground mb-6 text-center">
          Bitcoin haberleri, makaleler ve podcast içeriklerimizden haberdar olmak için abone olun.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-info-foreground mb-2">
              E-posta Adresi
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-info-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="ornek@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-info-foreground mb-2">
              Bildirim Sıklığı
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dailyChecked}
                  onChange={(e) => setDailyChecked(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-info-foreground rounded"
                />
                <span className="ml-2 text-sm text-info-foreground">Günlük bildirimler</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={weeklyChecked}
                  onChange={(e) => setWeeklyChecked(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-info-foreground rounded"
                />
                <span className="ml-2 text-sm text-info-foreground">Haftalık bildirimler</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/80 disabled:bg-primary/40 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            {isSubmitting ? "Abone Olunuyor..." : "Abone Ol"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md text-sm ${
              isSuccess ? "bg-success/10 text-success" : "bg-error/10 text-error"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
