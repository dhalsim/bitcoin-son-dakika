import { Mic } from "lucide-react";
import { LoaderFunctionArgs, MetaFunction, useLoaderData } from "react-router-dom";

import { fetchSSGData } from "@/lib/ssg-data";
import MainContent from "@/components/MainContent";
import PodcastCard from "@/components/PodcastCard";

export const meta: MetaFunction = () => {
  const description =
    "Bitcoin dünyasından haberler, uzman görüşleri, analizler ve bitcoin ile ilgili makaleleri tartışıyoruz.";

  return [
    { title: "Podcastler - Bitcoin Son Dakika" },
    {
      name: "description",
      content: description,
    },
    { property: "og:title", content: "Podcastler - Bitcoin Son Dakika" },
    {
      property: "og:description",
      content: description,
    },
    { property: "og:type", content: "website" },
    { property: "og:url", content: "https://bitcoinsondakika.com/podcasts" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Podcastler - Bitcoin Son Dakika" },
    {
      name: "twitter:description",
      content: description,
    },
  ];
};

export async function loader({}: LoaderFunctionArgs) {
  try {
    const ssgData = await fetchSSGData();

    return { podcasts: ssgData.podcasts, lastUpdated: ssgData.lastUpdated };
  } catch (error) {
    console.error("Error loading podcast data:", error);

    return { podcasts: [], lastUpdated: Date.now() };
  }
}

export default function PodcastsPage() {
  const { podcasts } = useLoaderData<typeof loader>();

  return (
    <MainContent>
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Mic className="h-12 w-12 text-red-500 mr-3" />
              <h1 className="text-4xl font-bold text-gray-900 dark:text-foreground">Podcastler</h1>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Bitcoin dünyasından en güncel podcast bölümleri. Uzman görüşleri, analizler ve detaylı
              açıklamalar.
            </p>
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">{podcasts.length} podcast bulundu</p>
          </div>

          {/* Podcasts Grid */}
          {podcasts.length === 0 ? (
            <div className="text-center py-12">
              <Mic className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                Podcast bulunamadı
              </h3>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {podcasts.map((podcast) => (
                <PodcastCard key={podcast.id} podcast={podcast} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainContent>
  );
}
