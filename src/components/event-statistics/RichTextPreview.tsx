import type { RichTextPreviewProps } from "./types";

export function RichTextPreview({ content }: RichTextPreviewProps) {
  const renderContent = (text: string) => {
    // Simple regex patterns for common Nostr content
    const patterns = [
      // URLs
      {
        pattern: /(https?:\/\/[^\s]+)/g,
        replacement: '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>',
      },
      // @mentions (npub or hex)
      {
        pattern: /@(npub[a-zA-Z0-9]+)/g,
        replacement: '<span class="text-purple-600 font-medium">@$1</span>',
      },
      // #tags
      {
        pattern: /#([a-zA-Z0-9_]+)/g,
        replacement: '<span class="text-green-600 font-medium">#$1</span>',
      },
      // Line breaks
      { pattern: /\n/g, replacement: "<br />" },
    ];

    let rendered = text;
    patterns.forEach(({ pattern, replacement }) => {
      rendered = rendered.replace(pattern, replacement);
    });

    return rendered;
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg border">
      <div className="text-xs text-gray-500 mb-2">Preview:</div>
      <div
        className="text-sm prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: renderContent(content) }}
      />
    </div>
  );
}
