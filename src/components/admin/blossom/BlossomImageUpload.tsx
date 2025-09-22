import { ImageUrlInput } from "@/components/common/ImageUrlInput";
import { useBlossomUpload } from "@/hooks/useBlossomUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Example Blossom servers - in real usage, these would come from your server configuration
const DEFAULT_BLOSSOM_SERVERS = [
  "https://blossom.band",
  "https://blossom.primal.net",
  "https://nostr.download",
  "https://24242.io",
  "https://cdn.nostrcheck.me",
  "https://blossom.nostr.build",
];

interface BlossomImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  blossomServers?: string[];
  authToken?: string; // Nostr auth token for API calls
}

export function BlossomImageUpload({
  value,
  onChange,
  label = "Image URL",
  placeholder = "Enter image URL or upload file",
  blossomServers = DEFAULT_BLOSSOM_SERVERS,
  authToken,
}: BlossomImageUploadProps) {
  const { uploadToBlossom, isUploading, error } = useBlossomUpload();

  const handleUploadToBlossom = async (
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
    if (!authToken) {
      throw new Error("Authentication token required for upload");
    }

    // Create a custom fetch function that includes the auth token
    const originalFetch = window.fetch;
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      return originalFetch(input, {
        ...init,
        headers: {
          ...init?.headers,
          Authorization: authToken,
        },
      });
    };

    try {
      return await uploadToBlossom(file, servers, options);
    } finally {
      // Restore original fetch
      window.fetch = originalFetch;
    }
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
          onUploadToBlossom={authToken ? handleUploadToBlossom : undefined}
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
