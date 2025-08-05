import { ExternalLink } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/ui/FollowButton";
import { NIP05Badge } from "@/components/ui/NIP05Badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type ProfileItem } from "@/lib/nip01";

import { PROFILE_RELAYS } from "../../../api-helpers/utils";

interface ProfileAvatarProps {
  pubkey: string;
  disablePopup?: boolean;
  profile?: ProfileItem;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallbackSrc?: string;
  badge?: React.ReactNode;
  popupContent?: React.ReactNode;
}

// Helper function to get display name from profile
export const getDisplayName = (
  profile: ProfileItem | undefined,
  pubkey: string,
): string => {
  return profile?.display_name || profile?.name || `${pubkey.slice(0, 8)}...`;
};

// Helper function to get size classes
const getSizeClasses = (size: "sm" | "md" | "lg") => {
  switch (size) {
    case "sm":
      return "h-6 w-6";
    case "md":
      return "h-8 w-8";
    case "lg":
      return "h-10 w-10";
    default:
      return "h-8 w-8";
  }
};

export function ProfileAvatar({
  pubkey,
  profile,
  disablePopup = false,
  size = "md",
  className = "",
  badge,
  popupContent,
}: ProfileAvatarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const sizeClasses = getSizeClasses(size);

  const handleAvatarClick = () => {
    if (!disablePopup) {
      setIsPopoverOpen(true);
    }
  };

  const handleProfileClick = () => {
    const nprofile = nip19.nprofileEncode({
      pubkey,
      relays: [profile.relay || PROFILE_RELAYS[0]],
    });

    // Open user profile in njump.me
    window.open(`https://njump.me/${nprofile}`, "_blank");

    setIsPopoverOpen(false);
  };

  if (!profile) {
    return (
      <Avatar
        className={`${sizeClasses} ${className} ${"cursor-pointer hover:opacity-80 transition-opacity"} overflow-hidden`}
      >
        <AvatarFallback className="text-xs">
          {pubkey.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  }

  const displayName = getDisplayName(profile, pubkey);

  const avatarElement = (
    <div className="relative inline-block">
      <Avatar
        className={`${sizeClasses} ${className} ${"cursor-pointer hover:opacity-80 transition-opacity"} overflow-hidden`}
        onClick={handleAvatarClick}
      >
        {profile.picture && (
          <AvatarImage src={profile.picture} alt={displayName} />
        )}
        <AvatarFallback className="text-xs">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
        {badge && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            {badge}
          </div>
        )}
      </Avatar>
    </div>
  );

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>{avatarElement}</PopoverTrigger>
      <PopoverContent className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {profile.picture && (
                <AvatarImage src={profile.picture} alt={displayName} />
              )}
              <AvatarFallback className="text-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {displayName}
              </h4>
              {profile.nip05 && (
                <NIP05Badge nip05={profile.nip05} pubkey={pubkey} size="sm" />
              )}
            </div>
          </div>

          {profile.about && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {profile.about}
            </p>
          )}

          {popupContent && (
            <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
              {popupContent}
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleProfileClick}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Profili Gör
            </Button>
            <FollowButton
              pubkey={pubkey}
              size="sm"
              variant="outline"
              className="flex-1"
              onError={(error) => {
                // You can handle errors here if needed
                console.error("Follow error:", error);
              }}
              onFollowChange={(isFollowing) => {
                // You can handle follow state changes here if needed
                console.log("Follow state changed:", isFollowing);
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
