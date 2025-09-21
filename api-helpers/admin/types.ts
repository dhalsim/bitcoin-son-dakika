import type { AuthResult } from "../types.js";
import type {
  ArticleTag,
  NewsTag,
  PublishEventResponseCreator as PublishEventResponseType,
} from "../utils.js";

export interface AdminActionData {
  pubkey?: string;
}
export type TwitterOAuthParams = {
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_TOKEN_SECRET: string;
};

// Types for Blossom blob listing
export type BlobDescriptor = {
  url: string;
  sha256: string;
  size: number;
  type: string;
  uploaded: number;
};

export type BlossomServerBlobs = {
  server: string;
  blobs: BlobDescriptor[];
  error?: string;
};

export type XAuthHeaderParams = TwitterOAuthParams & {
  method: "POST" | "GET" | "PUT" | "DELETE";
  url: string;
};

// Re-export commonly used types here for convenience in admin modules
export type { AuthResult, ArticleTag, NewsTag, PublishEventResponseType };
