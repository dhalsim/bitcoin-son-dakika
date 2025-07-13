import React from 'react';
import type { MetaFunction } from "react-router";
import { useSSGData } from '../hooks/useSSGData';

export const meta: MetaFunction = () => {
  return [
    { title: "SSG Debug - Bitcoin Son Dakika" },
    { name: "description", content: "Debug page for SSG data fetching" },
  ];
};

export default function SSGDebug() {
  const ssgData = useSSGData();
  
  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Available</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This debug page is only available in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">SSG Data Debug</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Summary</h2>
            <div className="space-y-2">
              <p><strong>News Items:</strong> {ssgData.news.length}</p>
              <p><strong>Articles:</strong> {ssgData.articles.length}</p>
              <p><strong>Last Updated:</strong> {new Date(ssgData.lastUpdated).toLocaleString()}</p>
            </div>
          </div>

          {/* Latest News */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Latest News</h2>
            {ssgData.news.length > 0 ? (
              <div className="space-y-4">
                {ssgData.news.slice(0, 3).map((news, index) => (
                  <div key={news.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-medium text-sm mb-2">{news.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {new Date(news.publishedAt * 1000).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Category: {news.category || 'N/A'} | 
                      Content: {news.content.length} chars | 
                      Author: {news.author.pubkey.substring(0, 16)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No news items found</p>
            )}
          </div>

          {/* Latest Articles */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Latest Articles</h2>
            {ssgData.articles.length > 0 ? (
              <div className="space-y-4">
                {ssgData.articles.slice(0, 3).map((article, index) => (
                  <div key={article.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-medium text-sm mb-2">{article.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {new Date(article.publishedAt * 1000).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Category: {article.category || 'N/A'} | 
                      Content: {article.content.length} chars | 
                      Author: {article.author.pubkey.substring(0, 16)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No articles found</p>
            )}
          </div>

          {/* Raw Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
            <div className="bg-gray-100 dark:bg-gray-900 rounded p-4 overflow-auto max-h-96">
              <pre className="text-xs">
                {JSON.stringify(ssgData, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
} 