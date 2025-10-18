// Unified types for admin components

export type ZeronoisePrefillData = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  images: string[]; // Multiple images from Brave search
  from: "zeronoise";
};

export type ScrapedPrefillData = {
  title: string;
  summary: string;
  content: string;
  tags: string[];
  image: string; // Single image URL
  url: string;
  sources?: string[];
  from: "sources";
};

export type ManualPrefillData = {
  title?: string;
  summary?: string;
  image?: string;
  url?: string;
  content?: string;
  tags?: string[];
  sources?: string[];
  from?: "manual" | string;
};

// Union type for all prefill data
export type PrefillData = ZeronoisePrefillData | ScrapedPrefillData | ManualPrefillData;

// Type guards to check which type of prefill data we're dealing with
export function isZeronoisePrefillData(data: PrefillData): data is ZeronoisePrefillData {
  return data.from === "zeronoise";
}

export function isScrapedPrefillData(data: PrefillData): data is ScrapedPrefillData {
  return data.from === "sources";
}

export function isManualPrefillData(data: PrefillData): data is ManualPrefillData {
  return (
    !data.from ||
    data.from === "manual" ||
    (!isZeronoisePrefillData(data) && !isScrapedPrefillData(data))
  );
}
