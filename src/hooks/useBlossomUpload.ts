import { useState } from "react";

import { WEBSITE_URL } from "@/lib/constants";

export interface UploadOptions {
  optimize: boolean;
  generateBlurHash: boolean;
  format: "webp" | "avif" | "jpeg";
  quality: number;
  maxWidth: number | null;
}

export interface UploadResult {
  successful: Array<{ server: string; descriptor: any }>;
  failed: Array<{ server: string; error: string }>;
  sha256: string;
  contentType: string;
  size: number;
  blurhash?: { blurhash: string; width: number; height: number };
}

export function useBlossomUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadToBlossom = async (
    file: File,
    servers: string[],
    options: UploadOptions,
    authToken: string,
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("action", "upload-blossom-media");
      formData.append("file", file);
      formData.append("servers", servers.join(","));
      formData.append("optimize", options.optimize.toString());
      formData.append("generateBlurHash", options.generateBlurHash.toString());
      formData.append("format", options.format);
      formData.append("quality", options.quality.toString());
      if (options.maxWidth) {
        formData.append("maxWidth", options.maxWidth.toString());
      }

      const url = `${WEBSITE_URL}/api/admin-panel`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: authToken,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));

        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);

      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadUrlToBlossom = async (
    url: string,
    servers: string[],
    options: UploadOptions,
    authToken: string,
  ): Promise<UploadResult> => {
    setIsUploading(true);
    setError(null);

    try {
      const apiUrl = `${WEBSITE_URL}/api/admin-panel`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify({
          action: "upload-file-url",
          url,
          servers,
          optimize: options.optimize,
          generateBlurHash: options.generateBlurHash,
          format: options.format,
          quality: options.quality,
          maxWidth: options.maxWidth,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Upload failed" }));

        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setError(errorMessage);

      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadToBlossom,
    uploadUrlToBlossom,
    isUploading,
    error,
  };
}
