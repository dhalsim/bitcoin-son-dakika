import { AlertCircle, RefreshCw, Shield, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type AdminData = {
  adminUsers: string[];
  editorUsers: string[];
  news: { eTag: string; relay: string }[];
  articles: { aTag: string; relay: string }[];
};

type AdminStatisticsProps = {
  adminData: AdminData | null;
  onOpenTab?: (tab: "stats" | "news" | "articles" | "users" | "compose" | "deploy") => void;
};

export default function AdminStatistics({ adminData, onOpenTab }: AdminStatisticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              <p className="text-gray-600 dark:text-gray-400">Yöneticiler</p>
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
              <p className="text-gray-600 dark:text-gray-400">Editörler</p>
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
              <p className="text-gray-600 dark:text-gray-400">Haberler</p>
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
              <p className="text-gray-600 dark:text-gray-400">Makaleler</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
