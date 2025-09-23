import { Badge } from "@/components/ui/badge";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { extractAmountFromBolt11 } from "@/lib/nip57";
import type { ZapReceipt } from "@/lib/nip57";
import type { ProfileItem } from "@/lib/nip01";
import { extractEmojiInfo } from "@/lib/utils";

import type { ExpandedReactionsProps } from "./types";

const zapRenderer =
  (profiles: Map<string, ProfileItem>, author: ProfileItem) => (reactionEvent: ZapReceipt) => {
    let badge: React.ReactNode = null;
    let zapMessage: React.ReactNode = null;
    let pubkey = reactionEvent.zapRequest.pubkey;
    let profile = profiles.get(pubkey);

    const bolt11 = reactionEvent.event.tags.find((tag) => tag[0] === "bolt11")?.[1];

    if (bolt11) {
      const amount = extractAmountFromBolt11(bolt11);

      badge = (
        <Badge
          variant="secondary"
          className="text-[8px] flex items-center bg-orange-500/70 text-gray-600 border-0 px-0.5 py-0 h-2 w-8 justify-center leading-none rounded-none"
        >
          {amount}
        </Badge>
      );

      const zapperName = profile?.display_name || profile?.name || `${pubkey.slice(0, 8)}...`;
      const zappedName = author?.display_name || `${author?.pubkey.slice(0, 8)}...`;

      const zapContent = reactionEvent.zapRequest.content;

      zapMessage = (
        <span>
          <strong>{zapperName}</strong> {zappedName}'ye {amount} Sats ⚡️ Gönderdi
          {zapContent ? `, Mesaj: "${zapContent}"` : ""}
        </span>
      );

      return (
        <ProfileAvatar
          key={reactionEvent.event.id}
          pubkey={pubkey}
          profile={profile}
          size="sm"
          badge={badge}
          popupContent={zapMessage}
        />
      );
    } else {
      return null;
    }
  };

export function ExpandedReactions({
  reactionGroups,
  profiles,
  author,
  onRepostClick,
  onReactionClick,
  onZapClick,
}: ExpandedReactionsProps) {
  if (reactionGroups.length === 0) {
    return null;
  }

  const zapAvatarRenderer = zapRenderer(profiles, author);

  return (
    <div className="pt-3 space-y-3 border-l-2 border-amber-700 bg-amber-50/30 rounded-r-lg pl-4">
      {reactionGroups.map((group) => (
        <div key={group.key} className="grid grid-cols-[auto_auto_1fr] gap-3 items-center">
          {(() => {
            const commonClasses = `flex items-center ${group.color}`;

            if (group.type === "zap" && onZapClick) {
              return (
                <button
                  type="button"
                  onClick={onZapClick}
                  className={`${commonClasses} cursor-pointer hover:opacity-80`}
                  title="Zap Gönder"
                >
                  {group.icon}
                </button>
              );
            }

            if (group.type === "repost" && onRepostClick) {
              return (
                <button
                  type="button"
                  onClick={onRepostClick}
                  className={`${commonClasses} cursor-pointer hover:opacity-80`}
                  title="Yeniden paylaş"
                >
                  {group.icon}
                </button>
              );
            }

            if ((group.type === "like" || group.type === "dislike") && onReactionClick) {
              const content = group.type === "like" ? "+" : "-";
              return (
                <button
                  type="button"
                  onClick={() => onReactionClick(content, null)}
                  className={`${commonClasses} cursor-pointer hover:opacity-80`}
                  title={group.type === "like" ? "Beğen" : "Beğenme"}
                >
                  {group.icon}
                </button>
              );
            }

            if (group.type === "emoji" && onReactionClick) {
              // Use the first event's content as the emoji to send again
              const first = group.events[0];

              const { name, url } = extractEmojiInfo(first);

              return (
                <button
                  type="button"
                  onClick={() => onReactionClick(name, url)}
                  className={`${commonClasses} cursor-pointer hover:opacity-80`}
                  title="Emoji ile tepki ver"
                >
                  {group.icon}
                </button>
              );
            }

            return <span className={commonClasses}>{group.icon}</span>;
          })()}

          <span className="text-sm font-medium text-right min-w-[1rem] flex items-center">
            {group.count}
          </span>

          <div className="flex flex-wrap gap-1 items-center">
            {group.type === "zap"
              ? group.events.slice(0, 10).map(zapAvatarRenderer)
              : group.events.slice(0, 10).map((reactionEvent) => {
                  const pubkey = reactionEvent.pubkey;
                  const profile = profiles.get(pubkey);
                  return (
                    <ProfileAvatar
                      key={reactionEvent.id}
                      pubkey={pubkey}
                      profile={profile}
                      size="sm"
                    />
                  );
                })}

            {group.events.length > 10 && (
              <Badge variant="secondary" className="text-xs flex items-center">
                +{group.events.length - 10} daha
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
