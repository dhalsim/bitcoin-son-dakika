export interface EmojiData {
  emoji: string;
  hints: string[];
}

export interface EmojiCategories {
  [key: string]: EmojiData[];
}

export type EmojiUsage = {
  [emoji: string]: {
    count: number;
    emojiUrl: string | null;
  };
};
