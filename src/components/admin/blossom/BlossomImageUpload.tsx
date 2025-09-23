import { ImageUrlInput } from "@/components/common/ImageUrlInput";
import { useBlossomUpload } from "@/hooks/useBlossomUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { createNIP98Auth } from "../utils";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { WEBSITE_URL } from "@/lib/constants";

interface BlossomImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  blossomServers: string[];
  label?: string;
  placeholder?: string;
}

export function BlossomImageUpload({
  value,
  onChange,
  blossomServers,
  label = "Image URL",
  placeholder = "Enter image URL or upload file",
}: BlossomImageUploadProps) {
  const { getPublicKey, signEvent } = useNostrAuth();
  const { uploadToBlossom, isUploading, error } = useBlossomUpload();

  const performUploadToBlossom = async (
    file: File,
    servers: string[],
    options: {
      optimize: boolean;
      generateBlurHash: boolean;
      format: "webp" | "avif" | "jpeg";
      quality: number;
      maxWidth: number | null;
    },
  ) => {
    const url = `${WEBSITE_URL}/api/admin-panel`;

    const authToken = await createNIP98Auth("POST", url, getPublicKey, signEvent);

    return await uploadToBlossom(file, servers, options, authToken);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blossom Image Upload</CardTitle>
        <CardDescription>
          Upload images to Blossom servers with optimization and BlurHash generation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ImageUrlInput
          value={value}
          onChange={onChange}
          label={label}
          placeholder={placeholder}
          blossomServers={blossomServers}
          onUploadToBlossom={performUploadToBlossom}
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
