export type ZeronoiseEmail = {
  messageId: string;
  subject: string;
  date: string; // ISO string
  blobUrl: string;
};

export type ZeronoiseNewsItem = {
  index: number;
  title: string;
  content: string;
};

export type FormattedNewsItem = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  tags_in_english: string[];
};

export type FormattedNewsItemWithImages = FormattedNewsItem & {
  images: string[];
};
