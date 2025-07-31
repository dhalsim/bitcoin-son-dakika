import { X } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useState, useEffect } from "react";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { FollowButton } from "@/components/ui/FollowButton.js";

import { PROFILE_RELAYS } from "../../api-helpers/utils.js";
import Footer from "../components/Footer";
import Header from "../components/Header";
import {
  convertNewsItemToNewsCardProps,
  convertArticleItemToNewsCardProps,
} from "../components/NewsCard";
import PriceBar from "../components/PriceBar";
import { useContentByAuthor } from "../hooks/useSSGData";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";
import { findProfileBySlug } from "../lib/ssg-data";
import type { NewsItem, ArticleItem } from "../lib/ssg-data";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const profile = data?.profile;

  if (!profile) {
    return [
      { title: `Profil Bulunamadı - ${WEBSITE_NAME}` },
      {
        name: "description",
        content: "Aradığınız profil bulunamadı.",
      },
    ];
  }

  return [
    { title: `${profile.display_name} - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${profile.display_name} tarafından yazılan Bitcoin haberleri ve makaleleri. ${WEBSITE_DESCRIPTION}`,
    },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug } = params;

  if (!slug) {
    throw new Response("Profile slug is required", { status: 400 });
  }

  // Get SSG data from global (available during prerendering)
  const ssgData = (global as any).__SSG_DATA__;

  if (!ssgData) {
    throw new Response("SSG data not available", { status: 500 });
  }

  const profile = findProfileBySlug(ssgData, slug);

  if (!profile) {
    throw new Response("Profile not found", { status: 404 });
  }

  return { profile, slug };
}

// NIP-05 Verification Badge Component
function NIP05Badge({ nip05, pubkey }: { nip05: string; pubkey: string }) {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only run NIP-05 verification in browser environment
    if (typeof window === "undefined") {
      setIsLoading(false);
      setIsVerified(false);

      return;
    }

    const verifyNIP05 = async () => {
      try {
        const [username, host] = nip05.split("@");
        if (!username || !host) {
          setIsVerified(false);
          setIsLoading(false);

          return;
        }

        const response = await fetch(
          `https://${host}/.well-known/nostr.json?user=${username}`,
        );
        if (!response.ok) {
          setIsVerified(false);
          setIsLoading(false);

          return;
        }

        const data = await response.json();
        const verified = data.names && data.names[username] === pubkey;
        setIsVerified(verified);
      } catch (error) {
        console.error("NIP-05 verification failed:", error);
        setIsVerified(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyNIP05();
  }, [nip05, pubkey]);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-1 text-gray-400">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-xs">Verifying...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      {isVerified ? (
        <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-medium">{nip05}</span>
        </div>
      ) : (
        <div className="flex items-center space-x-1 text-gray-500">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs">{nip05}</span>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { profile } = useLoaderData<typeof loader>();
  const [error, setError] = useState<string | null>(null);

  const nprofile = nip19.nprofileEncode({
    pubkey: profile.pubkey,
    relays: PROFILE_RELAYS,
  });

  // Get all content by this author
  const authorContent = useContentByAuthor(profile.pubkey);

  // Separate news and articles
  const newsItems = authorContent
    .filter((item): item is NewsItem => "identifier" in item === false)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .map(convertNewsItemToNewsCardProps);

  const articleItems = authorContent
    .filter((item): item is ArticleItem => "identifier" in item === true)
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .map(convertArticleItemToNewsCardProps);

  // Combine all content and sort by date
  const allContent = [...newsItems, ...articleItems].sort((a, b) => {
    const aTime = a.time.includes("saniye")
      ? 0
      : a.time.includes("dakika")
        ? 1
        : a.time.includes("saat")
          ? 2
          : 3;
    const bTime = b.time.includes("saniye")
      ? 0
      : b.time.includes("dakika")
        ? 1
        : b.time.includes("saat")
          ? 2
          : 3;

    return aTime - bTime;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Header />
      <PriceBar />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {error && (
            <div className="text-red-500 text-center mb-4 flex items-center justify-center gap-2">
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-blue-500 hover:text-blue-600"
              >
                <X className="w-4 h-4" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Profile Header */}
          <div className="mb-6 sm:mb-8 text-center">
            <div className="flex flex-col items-center space-y-4 mb-6">
              {profile.picture && (
                <img
                  src={profile.picture}
                  alt={profile.display_name}
                  className="w-20 h-20 rounded-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
              <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {profile.display_name}
                </h1>
                {profile.about && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl mx-auto">
                    {profile.about}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Links */}
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
              {profile.nip05 && (
                <NIP05Badge nip05={profile.nip05} pubkey={profile.pubkey} />
              )}
              {profile.website && (
                <a
                  href={
                    profile.website.startsWith("http")
                      ? profile.website
                      : `https://${profile.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Website</span>
                </a>
              )}
              {profile.lud16 && (
                <a
                  href={`lightning:${profile.lud16}`}
                  className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 hover:underline"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{profile.lud16}</span>
                </a>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mb-4">
              <FollowButton pubkey={profile.pubkey} />
              <a
                href={`https://njump.me/${nprofile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                Njump'ta Aç
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span>{newsItems.length} haber</span>
              <span>{articleItems.length} makale</span>
              <span>Toplam {allContent.length} içerik</span>
            </div>
          </div>

          {/* Content List */}
          {allContent.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Henüz içerik yok
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {profile.display_name} henüz haber veya makale paylaşmamış.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Tüm İçerikler
              </h2>

              <div className="grid gap-6">
                {/* {allContent.map((item, index) => (
                  <NewsCard key={`${item.title}-${index}`} {...item} />
                ))} */}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
