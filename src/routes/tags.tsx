import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData } from "react-router";

import type { SSGData } from "@/lib/ssg-data";
import PodcastCard from "@/components/PodcastCard";
import MainContent from "@/components/MainContent";
import NewsCard from "@/components/NewsCard";
import ArticleCard from "@/components/ArticleCard";
import { WEBSITE_NAME, WEBSITE_DESCRIPTION } from "@/lib/constants";

import { createTitleSlug } from "../../api-helpers/common_with_client";

export const meta: MetaFunction = ({ params }) => {
  const { slug } = params;

  if (!slug) {
    return [
      { title: `Etiket - ${WEBSITE_NAME}` },
      {
        name: "description",
        content: `${WEBSITE_DESCRIPTION}`,
      },
      {
        name: "keywords",
        content:
          "bitcoin, btc, nostr, bitcoin analiz, bitcoin haberleri, bitcoin makaleleri, bitcoin podcastleri",
      },
    ];
  }

  const title = `#${slug} Etiketi - ${WEBSITE_NAME}`;
  const description = `${WEBSITE_DESCRIPTION} - #${slug} etiketi ile ilgili Bitcoin haberleri ve makaleleri`;
  const keywords = `${slug}, bitcoin ${slug}, btc ${slug}, nostr ${slug}, bitcoin`;

  return [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywords },
    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
    // Twitter
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: "https://bitcoinsondakika.com/bitcoin-son-dakika-logo.png" },
  ];
};

export async function loader({ params }: LoaderFunctionArgs) {
  const { slug, type } = params;

  if (!slug) {
    throw new Response("Profile slug is required", { status: 400 });
  }

  // Get SSG data from global (available during prerendering)
  const ssgData: SSGData = (global as any).__SSG_DATA__;

  if (!ssgData) {
    throw new Response("SSG data not available", { status: 500 });
  }

  const tagContents = [...ssgData.articles, ...ssgData.news, ...ssgData.podcasts].filter(
    (content) =>
      content.tagItems.some((tagItem) => createTitleSlug(tagItem.tag) === createTitleSlug(slug)),
  );

  return { tagContents, slug, type };
}

export default function TagsPage() {
  const { tagContents, slug, type } = useLoaderData<typeof loader>();

  // If no content is available, show empty state
  if (tagContents.length === 0) {
    return (
      <MainContent>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">"#{slug}" Etiketi İçin İçerik Bulunamadı</h1>
          <p className="text-muted-foreground">Bu etiketle ilgili haber veya makale bulunmuyor.</p>
        </div>
      </MainContent>
    );
  }

  const slugLabel = tagContents[0].tagItems.find(
    (tagItem) => createTitleSlug(tagItem.tag) === createTitleSlug(slug),
  )?.label;

  return (
    <MainContent>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">"#{slugLabel}" Etiketi</h1>
        <p className="text-muted-foreground">
          Bu etiketle ilgili tüm{" "}
          {type === "news"
            ? "haberler"
            : type === "articles"
              ? "makaleler"
              : type === "podcast"
                ? "podcastler"
                : "haberler, makaleler ve podcastler"}
        </p>
      </div>

      {/* Filtered Content List - Single Column */}
      <div className="max-w-4xl mx-auto space-y-6">
        {tagContents.map((item, index) => {
          if (item.type === "news") {
            return <NewsCard key={index} {...item} />;
          } else if (item.type === "article") {
            return <ArticleCard key={index} {...item} />;
          } else {
            return <PodcastCard key={index} podcast={item} />;
          }
        })}
      </div>
    </MainContent>
  );
}
