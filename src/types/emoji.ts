export interface EmojiData {
  emoji: string;
  hints: string[];
}

export interface EmojiCategories {
  [key: string]: EmojiData[];
}

export type EmojiUsage = {
  [emoji: string]: number;
};
