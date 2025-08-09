import { AlertCircle, RefreshCw, Shield, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type AdminData = {
  adminUsers: string[];
  editorUsers: string[];
  news: { eTag: string; relay: string }[];
  articles: { aTag: string; relay: string }[];
};

export default function AdminStatistics({ adminData }: { adminData: AdminData | null }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
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

      <Card>
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

      <Card>
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

      <Card>
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
