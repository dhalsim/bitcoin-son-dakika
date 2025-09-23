import { ExternalLink } from "lucide-react";
import { nip19 } from "nostr-tools";
import { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/FollowButton";
import { NIP05Badge } from "@/components/NIP05Badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type ProfileItem } from "@/lib/nip01";

import { PROFILE_RELAYS } from "api-helpers/common_with_client";

interface ProfilePopoverProps {
  pubkey: string;
  profile?: ProfileItem;
  children: React.ReactNode;
  className?: string;
  popupContent?: React.ReactNode;
}

export function ProfilePopover({
  pubkey,
  profile,
  children,
  className = "",
  popupContent,
}: ProfilePopoverProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleProfileClick = () => {
    const nprofile = nip19.nprofileEncode({
      pubkey,
      relays: profile?.relays || PROFILE_RELAYS,
    });

    // Open user profile in njump.me
    window.open(`https://njump.me/${nprofile}`, "_blank");
    setIsPopoverOpen(false);
  };

  if (!profile) {
    return <>{children}</>;
  }

  const displayName = profile.display_name || profile.name || `${pubkey.slice(0, 8)}...`;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className={`w-80 shadow-lg ${className}`}>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              {profile.picture && <AvatarImage src={profile.picture} alt={displayName} />}
              <AvatarFallback className="text-sm">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-semibold">{displayName}</h4>
              {profile.nip05 && <NIP05Badge nip05={profile.nip05} pubkey={pubkey} size="sm" />}
            </div>
          </div>

          {profile.about && <p className="text-sm">{profile.about}</p>}

          {popupContent && <div className="text-sm p-2 rounded-md">{popupContent}</div>}

          <div className="flex space-x-2">
            <Button onClick={handleProfileClick} variant="outline" size="sm" className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Profili Gör
            </Button>
            <FollowButton
              pubkey={pubkey}
              size="sm"
              className="flex-1"
              onError={(error) => {
                console.error("Follow error:", error);
              }}
              onFollowChange={(isFollowing) => {
                console.log("Follow state changed:", isFollowing);
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
