import type { NostrEvent } from "nostr-tools";

import { NIP05Badge } from "@/components/NIP05Badge";
import { ProfileAvatar, getDisplayName } from "@/components/ProfileAvatar";
import type { ProfileItem } from "@/lib/nip01";
import type { ReplyNode } from "@/lib/nip10";
import { RenderedText } from "@/lib/text-renderer";

interface ThreadViewProps {
  thread: ReplyNode[];
  profiles: Map<string, ProfileItem>;
  className?: string;
  onReply?: (event: NostrEvent) => void;
  replyingTo?: NostrEvent | null;
}

interface ThreadNodeProps {
  node: ReplyNode;
  depth: number;
  profiles: Map<string, ProfileItem>;
  onReply?: (event: NostrEvent) => void;
  replyingTo?: NostrEvent | null;
}

function ThreadNode({ node, depth, onReply, profiles, replyingTo }: ThreadNodeProps) {
  const hasChildren = node.children.length > 0;
  const profile = profiles.get(node.event.pubkey);
  const displayName = getDisplayName(profile, node.event.pubkey);
  // Only highlight the exact node being replied to, not its children
  const isBeingRepliedTo = replyingTo?.id === node.event.id;

  const handleReply = () => {
    if (onReply) {
      onReply(node.event);
    }
  };

  return (
    <div
      className={`border-l-3 ${
        isBeingRepliedTo
          ? "border-blue-400 dark:border-blue-500"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      <div
        className={`flex items-start space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
          isBeingRepliedTo ? "bg-blue-50 dark:bg-blue-900/20" : ""
        }`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
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
              <NIP05Badge nip05={profile.nip05} pubkey={node.event.pubkey} size="sm" />
            )}
            <span className="text-xs text-gray-500">
              {new Date(node.event.created_at * 1000).toLocaleDateString()}
            </span>
            {isBeingRepliedTo && (
              <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
                Yanıtlanıyor
              </span>
            )}
          </div>

          <div className="text-sm mb-2">
            <RenderedText enableRichPreviews>{node.event.content}</RenderedText>
          </div>

          {/* Reply button */}
          <button
            onClick={handleReply}
            className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors cursor-pointer"
          >
            Yanıtla
          </button>
        </div>
      </div>

      {/* Children - always show them */}
      {hasChildren && (
        <div>
          {node.children.map((child) => (
            <ThreadNode
              key={child.event.id}
              node={child}
              depth={depth + 1}
              onReply={onReply}
              profiles={profiles}
              replyingTo={replyingTo}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ThreadView({
  thread,
  profiles,
  className = "",
  onReply,
  replyingTo,
}: ThreadViewProps) {
  if (!thread || thread.length === 0) {
    return <div className={`text-center text-gray-500 py-4 ${className}`}>Henüz yanıt yok.</div>;
  }

  return (
    <div className={className}>
      {thread.map((node) => (
        <ThreadNode
          key={node.event.id}
          node={node}
          depth={0}
          onReply={onReply}
          profiles={profiles}
          replyingTo={replyingTo}
        />
      ))}
    </div>
  );
}
