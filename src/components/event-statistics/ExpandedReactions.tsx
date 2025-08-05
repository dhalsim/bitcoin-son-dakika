import { Badge } from "@/components/ui/badge";
import { ProfileAvatar } from "@/components/ui/ProfileAvatar";
import { extractAmountFromBolt11 } from "@/lib/nip57";

import type { ExpandedReactionsProps } from "./types";

export function ExpandedReactions({
  reactionGroups,
  profiles,
  author,
}: ExpandedReactionsProps) {
  if (reactionGroups.length === 0) {
    return null;
  }

  return (
    <div className="pt-3 space-y-3 border-l-2 border-amber-700 bg-amber-50/30 rounded-r-lg pl-4">
      {reactionGroups.map((group) => (
        <div
          key={group.key}
          className="grid grid-cols-[auto_auto_1fr] gap-3 items-center"
        >
          <span className={`flex items-center ${group.color}`}>
            {group.icon}
          </span>

          <span className="text-sm font-medium text-right min-w-[1rem] flex items-center">
            {group.count}
          </span>

          <div className="flex flex-wrap gap-1 items-center">
            {group.events.slice(0, 10).map((reactionEvent) => {
              let pubkey = reactionEvent.pubkey;
              let badge = null;
              let zapMessage = null;
              let profile = profiles.get(pubkey);

              if (group.type === "zap") {
                const Ptag = reactionEvent.tags.find(
                  (tag) => tag[0] === "P",
                )?.[1];

                const bolt11 = reactionEvent.tags.find(
                  (tag) => tag[0] === "bolt11",
                )?.[1];

                const zapRequestTag = reactionEvent.tags.find(
                  (tag) => tag[0] === "description",
                )?.[1];

                let zapContent = "";

                if (zapRequestTag) {
                  try {
                    const parsedZapRequest = JSON.parse(zapRequestTag);
                    zapContent = parsedZapRequest.content;
                  } catch (error) {
                    console.error("Error parsing zap request:", error);
                  }
                }

                if (Ptag && bolt11) {
                  pubkey = Ptag;
                  const amount = extractAmountFromBolt11(bolt11);

                  badge = (
                    <Badge
                      variant="secondary"
                      className="text-[8px] flex items-center bg-orange-500/70 text-gray-600 border-0 px-0.5 py-0 h-2 w-8 justify-center leading-none rounded-none"
                    >
                      {amount}
                    </Badge>
                  );

                  // Create zap message for popup
                  profile = profiles[pubkey];
                  const zapperName =
                    profile?.display_name ||
                    profile?.name ||
                    `${pubkey.slice(0, 8)}...`;

                  const zappedName =
                    author?.display_name || `${author?.pubkey.slice(0, 8)}...`;

                  zapMessage = (
                    <span>
                      <strong>{zapperName}</strong> {zappedName}'ye {amount}{" "}
                      Sats ⚡️ Gönderdi
                      {zapContent ? `, Mesaj: "${zapContent}"` : ""}
                    </span>
                  );
                } else {
                  // Skip this zap if we don't have complete information
                  return null;
                }
              }

              return (
                <ProfileAvatar
                  key={reactionEvent.id}
                  pubkey={pubkey}
                  profile={profile}
                  size="sm"
                  badge={badge}
                  popupContent={zapMessage}
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
