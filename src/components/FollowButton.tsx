import { UserCheck, UserPlus } from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { useState } from "react";

import {
  useUserWriteRelays,
  useUserFollowings,
  useRefreshFollowings,
} from "@/contexts/UserContext";
import { publishToRelays } from "@/lib/utils";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

interface FollowButtonProps {
  pubkey: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  onError?: (error: string) => void;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  pubkey,
  size = "md",
  className = "",
  onError,
  onFollowChange,
}: FollowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const userWriteRelays = useUserWriteRelays();
  const userFollowings = useUserFollowings();
  const refreshFollowings = useRefreshFollowings();
  const { getPublicKey, signEvent, isLoggedIn, showLoginModal } = useNostrAuth();

  // Check if user is following this pubkey
  const isFollowing = userFollowings.pubkeys.includes(pubkey);

  const publishEvent = async (event: NostrEvent, relays: string[]) => {
    const result = await publishToRelays(event, relays);

    return result.some((r) => r.success);
  };

  const handleFollowToggle = async () => {
    onError?.("");

    try {
      const toggleFollow = async () => {
        // Check if logged in, show login modal if not
        if (!isLoggedIn) {
          const loginSuccess = await showLoginModal("sign_event", {
            reason: "Takip listesi güncellemesi için giriş yapmalısınız.",
          });

          if (!loginSuccess) {
            onError?.("Giriş yapmanız gerekiyor.");
            return;
          }
        }

        const userPubkey = await getPublicKey({
          options: { reason: "Takip listesi güncellemesi" },
        });

        if (!userPubkey) {
          onError?.("Giriş yapmanız gerekiyor.");
          return;
        }

        setIsLoading(true);

        // Get current followings from context
        const currentFollowings = userFollowings.eventTags;
        const following = userFollowings.pubkeys.includes(pubkey);

        const newFollowTags = following
          ? currentFollowings.filter((t) => t[0] === "p" && t[1] !== pubkey)
          : [...currentFollowings, ["p", pubkey]];

        const event = {
          kind: 3,
          tags: newFollowTags,
          content: "",
          created_at: Math.floor(Date.now() / 1000),
        };

        try {
          const { signedEvent } = await signEvent({
            event,
            options: { reason: "Takip listesi güncellemesi" },
          });

          if (!signedEvent) {
            throw new Error("İmzalama başarısız");
          }

          const published = await publishEvent(signedEvent, userWriteRelays);

          if (!published) {
            onError?.("Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
            setIsLoading(false);

            return;
          }

          // Refresh followings from context
          refreshFollowings();
          onFollowChange?.(!following);
          setIsLoading(false);
        } catch (error) {
          onError?.("İmzalama hatası. Lütfen tekrar deneyiniz.");
          setIsLoading(false);
        }
      };

      toggleFollow();
    } catch (error) {
      console.error("Follow toggle failed:", error);
      setIsLoading(false);
      onError?.("Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
    }
  };

  // Size classes
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-3 py-1.5 text-xs";
      case "md":
        return "px-4 py-2 text-sm";
      case "lg":
        return "px-6 py-3 text-base";
      default:
        return "px-4 py-2 text-sm";
    }
  };

  // Don't show button if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Don't show button if followings are still loading
  if (userFollowings.isLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center ${getSizeClasses()} font-medium rounded-lg cursor-not-allowed ${className}`}
      >
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        Yükleniyor...
      </button>
    );
  }

  if (isLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center ${getSizeClasses()} font-medium rounded-lg cursor-not-allowed text-white ${className}`}
      >
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        Yükleniyor...
      </button>
    );
  }

  return (
    <button
      onClick={handleFollowToggle}
      className={`inline-flex items-center ${getSizeClasses()} font-medium rounded-lg transition-colors bg-green-600 hover:bg-green-700 text-white ${className}`}
    >
      {isFollowing ? (
        <>
          <UserCheck className="w-4 h-4 mr-2" />
          Takibi Bırak
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-2" />
          Takip Et
        </>
      )}
    </button>
  );
}
