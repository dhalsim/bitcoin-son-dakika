import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type ProfileItem } from "@/lib/nip01";
import { ProfilePopover } from "@/components/ui/ProfilePopover";

interface ProfileAvatarProps {
  pubkey: string;
  disablePopup?: boolean;
  profile?: ProfileItem;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  fallbackSrc?: string;
  badge?: React.ReactNode;
  popupContent?: React.ReactNode;
}

// Helper function to get display name from profile
export const getDisplayName = (profile: ProfileItem | undefined, pubkey: string): string => {
  return profile?.display_name || profile?.name || `${pubkey.slice(0, 8)}...`;
};

// Helper function to get size classes
const getSizeClasses = (size: "xs" | "sm" | "md" | "lg") => {
  switch (size) {
    case "xs":
      return "h-4 w-4";
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
  const sizeClasses = getSizeClasses(size);

  if (!profile) {
    return (
      <Avatar
        className={`${sizeClasses} ${className} ${"cursor-pointer hover:opacity-80 transition-opacity"} overflow-hidden`}
      >
        <AvatarFallback className="text-xs">{pubkey.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
    );
  }

  const displayName = getDisplayName(profile, pubkey);

  if (disablePopup) {
    return (
      <div className="relative inline-block">
        <Avatar className={`${sizeClasses} ${className} overflow-hidden`}>
          {profile.picture && <AvatarImage src={profile.picture} alt={displayName} />}
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
          {badge && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">{badge}</div>
          )}
        </Avatar>
      </div>
    );
  }

  return (
    <ProfilePopover pubkey={pubkey} profile={profile} popupContent={popupContent}>
      <div className="relative inline-block">
        <Avatar
          className={`${sizeClasses} ${className} cursor-pointer hover:opacity-80 transition-opacity overflow-hidden`}
        >
          {profile.picture && <AvatarImage src={profile.picture} alt={displayName} />}
          <AvatarFallback className="text-xs">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
          {badge && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">{badge}</div>
          )}
        </Avatar>
      </div>
    </ProfilePopover>
  );
}
