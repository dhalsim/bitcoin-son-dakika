import { AlertCircle, RefreshCw, Shield, Users, Mic } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { AdminTab } from "@/routes/admin";

import { ArticleTag, NewsTag, PodcastTag } from "../../../api-helpers/common_with_client";

type AdminData = {
  adminUsers: string[];
  editorUsers: string[];
  news: NewsTag[];
  articles: ArticleTag[];
  podcasts: PodcastTag[];
};

type AdminStatisticsProps = {
  adminData: AdminData | null;
  onOpenTab?: (tab: AdminTab) => void;
};

export default function AdminStatistics({ adminData, onOpenTab }: AdminStatisticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpenTab?.("users")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onOpenTab?.("users");
          }
        }}
        className="cursor-pointer hover:ring-1 hover:ring-border"
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{adminData?.adminUsers.length || 0}</p>
              <p className="text-gray-600 dark:text-gray-400">Yönetici</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpenTab?.("users")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onOpenTab?.("users");
          }
        }}
        className="cursor-pointer hover:ring-1 hover:ring-border"
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Users className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{adminData?.editorUsers.length || 0}</p>
              <p className="text-gray-600 dark:text-gray-400">Editör</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpenTab?.("news")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onOpenTab?.("news");
          }
        }}
        className="cursor-pointer hover:ring-1 hover:ring-border"
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <AlertCircle className="h-8 w-8 text-orange-500" />
            <div>
              <p className="text-2xl font-bold">{adminData?.news.length || 0}</p>
              <p className="text-gray-600 dark:text-gray-400">Haber</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpenTab?.("articles")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onOpenTab?.("articles");
          }
        }}
        className="cursor-pointer hover:ring-1 hover:ring-border"
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <RefreshCw className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold">{adminData?.articles.length || 0}</p>
              <p className="text-gray-600 dark:text-gray-400">Makale</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card
        role="button"
        tabIndex={0}
        onClick={() => onOpenTab?.("podcasts")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onOpenTab?.("podcasts");
          }
        }}
        className="cursor-pointer hover:ring-1 hover:ring-border"
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Mic className="h-8 w-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold">{adminData?.podcasts.length || 0}</p>
              <p className="text-gray-600 dark:text-gray-400">Podcast</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
