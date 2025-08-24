import { X } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useState } from "react";
import type { MetaFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";

import { FollowButton } from "@/components/FollowButton.js";
import { NIP05Badge } from "@/components/NIP05Badge.js";

import { PROFILE_RELAYS } from "../../api-helpers/utils.js";
import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import PodcastCard from "../components/PodcastCard";
import { useContentByAuthor } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";
import { findProfileBySlug } from "../lib/ssg-data";
import type { NewsItem, ArticleItem, PodcastItem } from "../lib/ssg-data";

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
    {
      name: "keywords",
      content:
        "bitcoin, btc, ${profile.display_name}, bitcoin haberleri, bitcoin makaleleri, bitcoin analiz, nostr, kripto para",
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

export default function ProfilePage() {
  const { profile } = useLoaderData<typeof loader>();
  const [error, setError] = useState<string | null>(null);

  const nprofile = nip19.nprofileEncode({
    pubkey: profile.pubkey,
    relays: PROFILE_RELAYS,
  });

  // Get all content by this author
  const authorContent = useContentByAuthor(profile.pubkey);

  // Combine all content and sort by date
  const authorContentSorted = authorContent.sort((a, b) => {
    return b.publishedAt - a.publishedAt;
  });

  const newsItems = authorContentSorted.filter((item): item is NewsItem => item.type === "news");

  const articleItems = authorContentSorted.filter(
    (item): item is ArticleItem => item.type === "article",
  );

  const podcastItems = authorContentSorted.filter(
    (item): item is PodcastItem => item.type === "podcast",
  );

  return (
    <MainContent>
      <div className="max-w-4xl mx-auto space-y-6">
        {error && (
          <div className="text-red-500 text-center mb-4 flex items-center justify-center gap-2">
            <p>{error}</p>
            <button onClick={() => setError(null)} className="text-blue-500 hover:text-blue-600">
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
            {profile.nip05 && <NIP05Badge nip05={profile.nip05} pubkey={profile.pubkey} />}
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
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
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
            <span>{podcastItems.length} podcast</span>
            <span>Toplam {authorContentSorted.length} içerik</span>
          </div>
        </div>

        {/* Content List */}
        {authorContentSorted.length === 0 ? (
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
              {authorContentSorted.map((item, index) => {
                if (item.type === "podcast") {
                  return <PodcastCard key={`${item.id}-${index}`} podcast={item} />;
                }

                return (
                  <NewsCard
                    key={`${item.title}-${index}`}
                    title={item.title}
                    summary={item.summary}
                    publishedAt={item.publishedAt}
                    event={item.event}
                    author={item.author}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainContent>
  );
}
