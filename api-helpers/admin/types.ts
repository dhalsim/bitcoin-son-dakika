import type { AuthResult } from "../types.js";
import type {
  ArticleTag,
  NewsTag,
  PublishEventResponse as PublishEventResponseType,
} from "../utils.js";

export interface AdminActionData {
  pubkey?: string;
}

export type AddArticlePayload =
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; a: string; relay: string };

export type AddArticleResolvedPayload = {
  aTag: string;
  relayTag: string;
  action: "add-article";
};

export type AddNewsPayload = {
  action: "add-news";
  eventId: string;
  relay: string;
};

export type RemoveNewsPayload = {
  action: "remove-news";
  eventId: string;
  relay: string;
};

export type RemoveArticlePayload = {
  action: "remove-article";
  aTag: string;
  relay: string;
};

export type PublishNewsPayload = {
  action: "publish-news";
  content: string;
  title: string;
  summary?: string;
  image?: string;
  tags: string[];
};

export type PublishArticlePayload = {
  action: "publish-article";
  content: string;
  title: string;
  summary?: string;
  image?: string;
  tags: string[];
};

export type UploadToXPayload = {
  action: "upload-to-x";
  formData: FormData;
  title: string;
};

export type TranslateNewsPayload = {
  action: "translate-news";
  textToTranslate: string[];
  targetLanguageCode: string;
};

export type TwitterOAuthParams = {
  TWITTER_API_KEY: string;
  TWITTER_API_SECRET: string;
  TWITTER_ACCESS_TOKEN: string;
  TWITTER_ACCESS_TOKEN_SECRET: string;
};

export type HandleUploadToXParams = TwitterOAuthParams & {
  authResult: AuthResult;
  paramsData: UploadToXPayload;
};

export type XAuthHeaderParams = TwitterOAuthParams & {
  method: "POST" | "GET" | "PUT" | "DELETE";
  url: string;
};

// Re-export commonly used types here for convenience in admin modules
export type { AuthResult, ArticleTag, NewsTag, PublishEventResponseType };
