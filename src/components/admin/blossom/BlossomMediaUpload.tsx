import { MediaUrlInput } from "@/components/common/MediaUrlInput";
import { useBlossomUpload, UploadOptions, UploadResult } from "@/hooks/useBlossomUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { createNIP98Auth } from "../utils";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { WEBSITE_URL } from "@/lib/constants";

interface BlossomMediaUploadProps {
  value: string;
  onChange: (url: string) => void;
  blossomServers: string[];
  label?: string;
  placeholder?: string;
}

export function BlossomMediaUpload({
  value,
  onChange,
  blossomServers,
  label = "Medya URL'si",
  placeholder = "Medya URL'si girin veya dosya yükleyin",
}: BlossomMediaUploadProps) {
  const { getPublicKey, signEvent } = useNostrAuth();
  const { uploadToBlossom, uploadUrlToBlossom, isUploading, error } = useBlossomUpload();

  const performUploadToBlossom = async (
    file: File,
    servers: string[],
    options: UploadOptions,
  ): Promise<UploadResult> => {
    const url = `${WEBSITE_URL}/api/admin-panel`;
    const authToken = await createNIP98Auth("POST", url, getPublicKey, signEvent);

    return uploadToBlossom(file, servers, options, authToken);
  };

  const performUploadUrlToBlossom = async (
    url: string,
    servers: string[],
    options: UploadOptions,
  ): Promise<UploadResult> => {
    const apiUrl = `${WEBSITE_URL}/api/admin-panel`;
    const authToken = await createNIP98Auth("POST", apiUrl, getPublicKey, signEvent);

    return uploadUrlToBlossom(url, servers, options, authToken);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blossom Medya Yükleme</CardTitle>
        <CardDescription>
          Blossom sunucularına görüntü ve video yükleyin, optimizasyon ve BlurHash oluşturma ile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MediaUrlInput
          value={value}
          onChange={onChange}
          label={label}
          placeholder={placeholder}
          blossomServers={blossomServers}
          onlyImage={false}
          onUploadToBlossom={performUploadToBlossom}
          onUploadUrlToBlossom={performUploadUrlToBlossom}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">Error: {error}</p>
          </div>
        )}

        {isUploading && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-600">Uploading to Blossom servers...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
