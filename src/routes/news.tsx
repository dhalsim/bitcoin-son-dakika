import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { redirect } from "react-router";

import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "../lib/constants";

export async function loader({ request }: LoaderFunctionArgs) {
  // Get SSG data from global (set during prerender)
  const ssgData = global.__SSG_DATA__;

  if (!ssgData) {
    throw new Error("SSG data not available");
  }

  // Calculate the latest page number (highest page = newest content)
  const NEWS_PER_PAGE = 10;
  const totalPages = Math.ceil(ssgData.news.length / NEWS_PER_PAGE);
  const latestPage = Math.max(1, totalPages);

  // Redirect to the latest page
  return redirect(`/haberler/${latestPage}`);
}

export const meta: MetaFunction = () => {
  return [
    { title: `Tüm Haberler - ${WEBSITE_NAME}` },
    {
      name: "description",
      content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin haberleri`,
    },
    {
      name: "keywords",
      content:
        "bitcoin, btc, bitcoin haberleri, kripto para haberleri, bitcoin son dakika, bitcoin güncel, nostr haberleri, bitcoin analiz, bitcoin piyasa, bitcoin teknoloji",
    },
    // Open Graph
    { property: "og:title", content: `Tüm Haberler - ${WEBSITE_NAME}` },
    { property: "og:description", content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin haberleri` },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
    // Twitter
    { name: "twitter:title", content: `Tüm Haberler - ${WEBSITE_NAME}` },
    { name: "twitter:description", content: `${WEBSITE_DESCRIPTION} - Tüm Bitcoin haberleri` },
    { name: "twitter:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
  ];
};

// This component redirects to the latest paginated page
export default function NewsPage() {
  // This component should never render as it redirects in the loader
  return null;
}
