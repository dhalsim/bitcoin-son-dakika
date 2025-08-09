import React from "react";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Sayfa Bulunamadı - Bitcoin Son Dakika" },
    {
      name: "description",
      content: "Aradığınız sayfa bulunamadı. Ana sayfaya geri dönebilirsiniz.",
    },
  ];
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700">404</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Sayfa Bulunamadı
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        <div className="space-y-4">
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-main-accent hover:bg-main-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-main-accent"
          >
            Ana Sayfaya Dön
          </a>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Bitcoin Son Dakika - Güncel Bitcoin Haberleri</p>
          </div>
        </div>
      </div>
    </div>
  );
}
