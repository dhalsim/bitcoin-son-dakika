import { useState } from "react";

export default function EmailSubscription() {
  const [email, setEmail] = useState("");
  const [dailyChecked, setDailyChecked] = useState(true);
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
    <div
      className={`bg-gradient-to-br from-blue-50 to-orange-50 dark:from-blue-500 dark:to-orange-900 border-2 border-blue-200 dark:border-blue-800 p-6 m-6 rounded-lg shadow-lg`}
    >
      <div className="max-w-md mx-auto">
        <h3 className="text-xl font-bold text-black dark:text-white mb-4 text-center">
          📧 E-posta Bülteni
        </h3>
        <p className="text-sm text-black dark:text-white mb-6 text-center">
          Bitcoin haberleri, makaleler ve podcast içeriklerimizden haberdar olmak için abone olun.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-black dark:text-white mb-2"
            >
              E-posta Adresi
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 transition-all duration-200"
              placeholder="ornek@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-black dark:text-white mb-2">
              Bildirim Sıklığı
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={dailyChecked}
                  onChange={(e) => setDailyChecked(e.target.checked)}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-400 border-blue-300 dark:border-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-black dark:text-white">Günlük bildirimler</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={weeklyChecked}
                  onChange={(e) => setWeeklyChecked(e.target.checked)}
                  className="h-4 w-4 text-orange-500 focus:ring-orange-400 border-blue-300 dark:border-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-black dark:text-white">
                  Haftalık bildirimler
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
          >
            {isSubmitting ? "Abone Olunuyor..." : "Abone Ol"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-4 rounded-lg text-sm font-medium ${
              isSuccess
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-2 border-green-300 dark:border-green-700"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-2 border-red-300 dark:border-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
