import { useRef } from "react";

import { ThreadView } from "../ThreadView";

import type { ThreadViewProps } from "./types";

export function ThreadViewWrapper({
  thread,
  loadingThread,
  isAtBottom,
  showOnlyCompose,
  profiles,
  onThreadReply,
  onThreadScroll,
}: ThreadViewProps) {
  const threadContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`space-y-2 relative ${showOnlyCompose ? "hidden" : ""}`}>
      <div
        ref={threadContainerRef}
        data-thread-container
        className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2"
        onScroll={onThreadScroll}
      >
        {loadingThread ? (
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        ) : (
          <ThreadView
            thread={thread}
            onReply={onThreadReply}
            profiles={profiles}
            className="w-full overflow-x-hidden"
          />
        )}
      </div>

      {/* Fixed gradient overlay at bottom - only show when not at bottom */}
      {!isAtBottom && (
        <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
      )}
    </div>
  );
}
