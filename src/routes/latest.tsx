import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";

import PodcastCard from "@/components/PodcastCard";
import { ContentItem } from "@/lib/ssg-data";

import MainContent from "../components/MainContent";
import NewsCard from "../components/NewsCard";
import ArticleCard from "../components/ArticleCard";
import { useSSGData } from "../contexts/SSGContext";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get SSG data from global (set during prerender)
  const ssgData = global.__SSG_DATA__;

  if (!ssgData) {
    throw new Error("SSG data not available");
  }

  // Combine news, articles, and podcasts to calculate total pages
  const allItems: ContentItem[] = [...ssgData.news, ...ssgData.articles, ...ssgData.podcasts];

  // Calculate the latest page number (highest page = newest content)
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
  const latestPage = Math.max(1, totalPages);

  // Redirect to the latest page
  return redirect(`/son-dakika/${latestPage}`);
}

export const meta: MetaFunction = () => {
  return [
    { title: `En Son İçerikler - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri`,
    },
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin son dakika, bitcoin güncel, bitcoin haberleri, bitcoin makaleleri, bitcoin analiz, kripto para güncel, nostr güncel, bitcoin piyasa, bitcoin teknoloji",
    },
    // Open Graph
    { property: "og:title", content: `En Son İçerikler - ${WEBSITE_NAME}` },
    {
      property: "og:description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri`,
    },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
    // Twitter
    { name: "twitter:title", content: `En Son İçerikler - ${WEBSITE_NAME}` },
    {
      name: "twitter:description",
      content: `${WEBSITE_DESCRIPTION} - En güncel Bitcoin haberleri ve makaleleri`,
    },
    { name: "twitter:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
  ];
};

// This component redirects to the latest paginated page
export default function LatestPage() {
  // This component should never render as it redirects in the loader
  return null;
}
