import { useEffect, useRef, useState } from "react";

import { ThreadView } from "../ThreadView";

import type { ThreadViewProps } from "./types";
import { isContainerAtBottom } from "./utils";

export function ThreadViewWrapper({
  thread,
  loadingThread,
  profiles,
  onThreadReply,
}: ThreadViewProps) {
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    if (!threadContainerRef.current) {
      return;
    }

    setIsAtBottom(isContainerAtBottom({ current: threadContainerRef.current }));
  }, [threadContainerRef]);

  return (
    <div className="space-y-2 relative">
      <div
        ref={threadContainerRef}
        data-thread-container
        className="max-h-[300px] overflow-y-auto overflow-x-hidden pr-2"
        onScroll={() => {
          setIsAtBottom(isContainerAtBottom({ current: threadContainerRef.current }));
        }}
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
        <div className="absolute bottom-0 left-0 right-2 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      )}
    </div>
  );
}
