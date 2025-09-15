import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { useEffect, useRef } from "react";
import { createTitleSlug } from "../../api-helpers/utils";
import { SSGData } from "@/lib/ssg-data";

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    const { slug } = params;

    if (!slug) {
      throw new Error("Podcast slug is required");
    }

    // Get SSG data from global (available during prerendering)
    const ssgData: SSGData = (global as any).__SSG_DATA__;

    if (!ssgData) {
      throw new Response("SSG data not available", { status: 500 });
    }

    // Find podcast by slug using createTitleSlug function
    const foundPodcast = ssgData.podcasts.find((p) => {
      if (!p.title) {
        return false;
      }

      return createTitleSlug(p.title) === slug;
    });

    if (!foundPodcast) {
      throw new Error("Podcast not found");
    }

    return { podcast: foundPodcast };
  } catch (error) {
    console.error("Error loading podcast:", error);
    return { podcast: null };
  }
}

export default function PodcastPlayerPage() {
  const { podcast } = useLoaderData<typeof loader>();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Auto-play when the page loads (for Twitter embedding)
    if (audioRef.current && podcast?.audioUrl) {
      // Small delay to ensure audio element is ready
      const timer = setTimeout(() => {
        audioRef.current?.play().catch((error) => {
          console.log("Autoplay prevented:", error);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [podcast?.audioUrl]);

  if (!podcast) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground mb-2">
            Podcast Bulunamadı
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Aradığınız podcast bulunamadı.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Twitter Player Card - Minimal, responsive design */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {podcast.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {podcast.summary || podcast.content?.substring(0, 150) || "Bitcoin podcast"}
            </p>
          </div>

          {/* Audio Player */}
          <div className="p-6">
            <audio
              ref={audioRef}
              src={podcast.audioUrl}
              controls
              className="w-full h-12"
              preload="metadata"
            >
              Your browser does not support the audio element.
            </audio>

            {/* Additional info */}
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Bitcoin Son Dakika</span>
              {podcast.duration && (
                <span>
                  {Math.floor(podcast.duration / 60)}:
                  {(podcast.duration % 60).toString().padStart(2, "0")}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Bitcoin Son Dakika
            </p>
          </div>
        </div>
      </div>

      {/* Structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "AudioObject",
            name: podcast.title,
            description: podcast.summary || podcast.title,
            contentUrl: podcast.audioUrl,
            encodingFormat: podcast.audioUrl.endsWith(".m4a") ? "audio/mp4" : "audio/mpeg",
            duration: podcast.duration,
            author: {
              "@type": "Person",
              name: podcast.author?.name || "Bitcoin Son Dakika",
            },
            publisher: {
              "@type": "Organization",
              name: "Bitcoin Son Dakika",
            },
          }),
        }}
      />
    </div>
  );
}
