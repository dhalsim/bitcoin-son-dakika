import { nip19 } from "nostr-tools";
import { useEffect, useState } from "react";

import { getProfiles } from "@/lib/nip01";
import { getCache } from "@/lib/cache";
import { getDisplayName } from "@/components/ui/ProfileAvatar";
import { ProfilePopover } from "@/components/ui/ProfilePopover";
import { type ProfileItem } from "@/lib/nip01";

interface ProfileMentionProps {
  nprofile: string;
  className?: string;
  linkClassName?: string;
  popupContent?: React.ReactNode;
}

export function ProfileMention({
  nprofile,
  className = "",
  linkClassName = "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline",
  popupContent,
}: ProfileMentionProps) {
  const [profile, setProfile] = useState<ProfileItem | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const { data, type } = nip19.decode(nprofile);

      if (type === "nprofile") {
        const subCloser = getProfiles({
          authors: [data.pubkey],
          relayHints: data.relays,
          onUpdate: (profiles) => {
            if (profiles) {
              const profileItem = profiles.get(data.pubkey);

              if (profileItem) {
                setProfile(profileItem);
                setIsLoading(false);
              }

              subCloser();
            }
          },
        });
      }
    } catch (error) {
      console.error("Error decoding nprofile:", error);
      setIsLoading(false);
    }
  }, []);

  // If we have a profile, render with ProfilePopover
  if (profile) {
    const displayName = getDisplayName(profile, profile.pubkey);

    return (
      <ProfilePopover
        pubkey={profile.pubkey}
        profile={profile}
        popupContent={popupContent}
        className={className}
      >
        <span className={`cursor-pointer ${linkClassName}`}>@{displayName}</span>
      </ProfilePopover>
    );
  }

  // If still loading or no profile, render as regular link
  return (
    <a
      href={`https://njump.me/${nprofile}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`${linkClassName} ${className}`}
      title="View on Nostr"
    >
      nostr:{nprofile}
    </a>
  );
}
