import React from "react";

import { LinkPreview } from "@/components/LinkPreview";

// Regular expressions for different content types
const URL_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gi;
const IMAGE_REGEX =
  /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)\.(jpg|jpeg|png|gif|webp|svg)(\?[^&\s]*)?/gi;
const NOSTR_REGEX = /nostr:([a-zA-Z0-9]+)/gi;

interface RenderedTextProps {
  children: string;
  className?: string;
  imageClassName?: string;
  linkClassName?: string;
  enableRichPreviews?: boolean;
  richPreviewClassName?: string;
  preserveNewlines?: boolean;
}

interface TextSegment {
  type: "text" | "link" | "image" | "nostr";
  content: string;
  url?: string;
  alt?: string;
}

function parseText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  // Find all matches for images, links, and nostr references
  const allMatches: Array<{
    type: "image" | "link" | "nostr";
    match: RegExpMatchArray;
    index: number;
  }> = [];

  // Find image matches first (images are more specific than general URLs)
  let match;
  const imageRegex = new RegExp(IMAGE_REGEX);
  while ((match = imageRegex.exec(text)) !== null) {
    allMatches.push({
      type: "image",
      match,
      index: match.index!,
    });
  }

  // Find nostr matches
  const nostrRegex = new RegExp(NOSTR_REGEX);
  while ((match = nostrRegex.exec(text)) !== null) {
    allMatches.push({
      type: "nostr",
      match,
      index: match.index!,
    });
  }

  // Find general URL matches (excluding those already matched as images)
  const urlRegex = new RegExp(URL_REGEX);
  while ((match = urlRegex.exec(text)) !== null) {
    const isAlreadyMatched = allMatches.some(
      (existing) =>
        existing.index <= match.index! &&
        existing.index + existing.match[0].length > match.index!,
    );

    if (!isAlreadyMatched) {
      allMatches.push({
        type: "link",
        match,
        index: match.index!,
      });
    }
  }

  // Sort matches by index
  allMatches.sort((a, b) => a.index - b.index);

  // Build segments
  for (const { type, match, index } of allMatches) {
    // Add text before this match
    if (index > currentIndex) {
      const textContent = text.slice(currentIndex, index);
      if (textContent) {
        segments.push({
          type: "text",
          content: textContent,
        });
      }
    }

    // Add the matched segment
    const matchContent = match[0];
    switch (type) {
      case "image":
        segments.push({
          type: "image",
          content: matchContent,
          url: matchContent,
          alt: "Image",
        });
        break;
      case "nostr":
        segments.push({
          type: "nostr",
          content: matchContent,
          url: matchContent,
        });
        break;
      case "link":
        segments.push({
          type: "link",
          content: matchContent,
          url: matchContent,
        });
        break;
    }

    currentIndex = index + matchContent.length;
  }

  // Add remaining text
  if (currentIndex < text.length) {
    const remainingText = text.slice(currentIndex);
    if (remainingText) {
      segments.push({
        type: "text",
        content: remainingText,
      });
    }
  }

  return segments;
}

export function RenderedText({
  children,
  className = "",
  imageClassName = "max-w-full h-auto rounded-md my-2",
  linkClassName = "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline",
  enableRichPreviews = false,
  richPreviewClassName = "my-2",
  preserveNewlines = false,
}: RenderedTextProps) {
  const renderSegments = (segmentsToRender: TextSegment[], keyPrefix = "") =>
    segmentsToRender.map((segment, index) => {
      const key = `${keyPrefix}${index}`;
      switch (segment.type) {
        case "image":
          return (
            <img
              key={key}
              src={segment.url}
              alt={segment.alt}
              className={imageClassName}
              loading="lazy"
            />
          );
        case "link":
          if (enableRichPreviews) {
            return (
              <LinkPreview
                key={key}
                url={segment.url!}
                className={richPreviewClassName}
              />
            );
          }

          return (
            <a
              key={key}
              href={segment.url}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
            >
              {segment.content}
            </a>
          );
        case "nostr":
          return (
            <a
              key={key}
              href={`https://njump.me/${segment.content}`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClassName}
              title="View on Nostr"
            >
              {segment.content}
            </a>
          );
        case "text":
        default:
          return <React.Fragment key={key}>{segment.content}</React.Fragment>;
      }
    });

  let content: React.ReactNode;

  if (preserveNewlines) {
    const lines = children.split(/\r?\n/);
    content = lines.map((line, lineIndex) => (
      <React.Fragment key={`line-${lineIndex}`}>
        {renderSegments(parseText(line), `l${lineIndex}-`)}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  } else {
    content = renderSegments(parseText(children));
  }

  return <div className={className}>{content}</div>;
}

// Utility function for cases where you just need the parsing logic
export function renderTextContent(text: string): React.ReactNode {
  return <RenderedText>{text}</RenderedText>;
}
