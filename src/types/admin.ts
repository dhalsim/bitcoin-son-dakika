import type { ArticleTag, NewsTag, PodcastTag, TagItem } from "api-helpers/utils";

export type AddArticlePayload =
  | { action: "add-article"; type: "naddr"; naddr: string }
  | { action: "add-article"; type: "a"; tagToBeAdded: ArticleTag };

export type AddNewsPayload = {
  action: "add-news";
  tagToBeAdded: NewsTag;
};

export type RemoveNewsPayload = {
  action: "remove-news";
  tagToBeRemoved: NewsTag;
  requestDeletion?: boolean;
};

export type RemoveArticlePayload = {
  action: "remove-article";
  tagToBeRemoved: ArticleTag;
};

export type AddAdminPayload = {
  action: "add-admin-pubkey";
  pubkey: string;
};

export type RemoveAdminPayload = {
  action: "remove-admin-pubkey";
  pubkey: string;
};

export type RemoveEditorPayload = {
  action: "remove-editor-pubkey";
  pubkey: string;
};

export type AddEditorPayload = {
  action: "add-editor-pubkey";
  pubkey: string;
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
  title: string;
  content: string;
  summary?: string;
  image?: string;
  tags: string[];
  publishedAt?: number; // For updates, use existing publishedAt
  dTag?: string; // For updates, use existing dTag
};

export type PublishPodcastPayload = {
  action: "publish-podcast";
  title: string;
  audioUrl: string;
  content: string;
  duration: number;
  summary?: string;
  image?: string;
  episodeNumber?: number;
  tags: string[];
  transcriptUrl?: string;
  chaptersUrl?: string;
  publishedAt?: number; // For updates, use existing publishedAt
  dTag?: string; // For updates, use existing dTag
};

export type RemovePodcastPayload = {
  action: "remove-podcast";
  tagToBeRemoved: PodcastTag;
};

export type TranslateNewsPayload = {
  action: "translate-news";
  textToTranslate: string[];
  targetLanguageCode: string;
};

export type UpdateTagsPayload = {
  action: "update-tags";
  tags: TagItem[];
  lastUpdated: number;
};

export type UpdateBlossomServersPayload = {
  action: "update-blossom-servers";
  servers: string[];
  lastUpdated: number;
};

export type FetchBlobListsPayload = {
  action: "fetch-blob-lists";
  servers: string[];
};

export type Payload =
  | AddNewsPayload
  | RemoveNewsPayload
  | AddArticlePayload
  | RemoveArticlePayload
  | AddAdminPayload
  | RemoveAdminPayload
  | RemoveEditorPayload
  | AddEditorPayload
  | PublishNewsPayload
  | PublishArticlePayload
  | PublishPodcastPayload
  | RemovePodcastPayload
  | TranslateNewsPayload
  | UpdateTagsPayload
  | UpdateBlossomServersPayload
  | FetchBlobListsPayload;
