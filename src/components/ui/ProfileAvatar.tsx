import { ExternalLink } from "lucide-react";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/ui/FollowButton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type ProfileItem } from "@/lib/nip01";

interface ProfileAvatarProps {
  pubkey: string;
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
  if (!profile) {
    return `${pubkey.slice(0, 8)}...`;
  }

  return profile.display_name || `${pubkey.slice(0, 8)}...`;
};

// Helper function to get avatar URL from profile
export const getAvatarUrl = (
  profile: ProfileItem | undefined,
  pubkey: string,
  fallbackSrc?: string,
): string => {
  if (profile?.picture) {
    return profile.picture;
  }

  if (fallbackSrc) {
    return fallbackSrc;
  }

  return `https://robohash.org/${pubkey}`;
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
  size = "md",
  className = "",
  fallbackSrc,
  badge,
  popupContent,
}: ProfileAvatarProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const displayName = getDisplayName(profile, pubkey);
  const avatarUrl = getAvatarUrl(profile, pubkey, fallbackSrc);
  const sizeClasses = getSizeClasses(size);

  const handleAvatarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPopoverOpen(true);
  };

  const handleProfileClick = () => {
    // Open user profile in njump.me
    window.open(`https://njump.me/${pubkey}`, "_blank");
    setIsPopoverOpen(false);
  };

  const avatarElement = (
    <div className="relative inline-block">
      <Avatar
        className={`${sizeClasses} ${className} ${"cursor-pointer hover:opacity-80 transition-opacity"} overflow-hidden`}
        onClick={handleAvatarClick}
      >
        <AvatarImage src={avatarUrl} alt={displayName} />
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

  // Mobile: Use Popover for better mobile UX
  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>{avatarElement}</PopoverTrigger>
      <PopoverContent className="w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="text-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                {displayName}
              </h4>
              {profile?.nip05 && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {profile.nip05}
                </p>
              )}
            </div>
          </div>

          {profile?.about && (
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
