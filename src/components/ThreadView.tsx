import { ChevronDown, ChevronRight } from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { useState } from "react";

import {
  ProfileAvatar,
  getDisplayName,
  type UserProfile,
} from "@/components/ui/ProfileAvatar";
import type { ReplyNode } from "@/lib/nip10";

interface ThreadViewProps {
  thread: ReplyNode[];
  className?: string;
  onReply?: (event: NostrEvent) => void;
  profiles?: { [pubkey: string]: UserProfile };
}

interface ThreadNodeProps {
  node: ReplyNode;
  depth: number;
  onReply?: (event: NostrEvent) => void;
  profiles?: { [pubkey: string]: UserProfile };
}

function ThreadNode({ node, depth, onReply, profiles }: ThreadNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const profile = profiles?.[node.event.pubkey];
  const displayName = getDisplayName(profile, node.event.pubkey);

  const handleReply = () => {
    if (onReply) {
      onReply(node.event);
    }
  };

  return (
    <div className="border-l-3 border-gray-200 dark:border-gray-700">
      <div
        className="flex items-start space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        style={{ marginLeft: `${depth * 20}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        )}

        {/* User avatar */}
        <ProfileAvatar
          pubkey={node.event.pubkey}
          profile={profile}
          size="md"
          className="flex-shrink-0"
        />

        {/* Event content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {displayName}
            </span>
            {profile?.nip05 && (
              <span className="text-xs text-blue-600 dark:text-blue-400">
                {profile.nip05}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {new Date(node.event.created_at * 1000).toLocaleDateString()}
            </span>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            {node.event.content}
          </p>

          {/* Reply button */}
          <button
            onClick={handleReply}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            Reply
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <ThreadNode
              key={child.event.id}
              node={child}
              depth={depth + 1}
              onReply={onReply}
              profiles={profiles}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadView({
  thread,
  className = "",
  onReply,
  profiles,
}: ThreadViewProps) {
  if (!thread || thread.length === 0) {
    return (
      <div className={`text-sm text-gray-500 dark:text-gray-400 ${className}`}>
        Henüz yanıt yok.
      </div>
    );
  }

  const getRepliesCount = (node: ReplyNode): number => {
    // Count this node as a reply plus all its children
    return (
      1 + node.children.reduce((acc, child) => acc + getRepliesCount(child), 0)
    );
  };

  const repliesCount = thread.reduce(
    (acc, node) => acc + getRepliesCount(node),
    0,
  );

  return (
    <div className={`space-y-1 ${className}`}>
      <h3 className="text-lg font-semibold text-purple-600 mb-4">
        Yanıtlar ({repliesCount})
      </h3>

      {thread.map((node) => (
        <ThreadNode
          key={node.event.id}
          node={node}
          depth={0}
          onReply={onReply}
          profiles={profiles}
        />
      ))}
    </div>
  );
}
