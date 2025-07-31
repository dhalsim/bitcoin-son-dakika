import { UserCheck, UserPlus } from "lucide-react";
import type { NostrEvent } from "nostr-tools";
import { useState, useEffect } from "react";

import { getFollowsEvent } from "@/lib/nip02";
import { getUserPubkey, signEventByNip07 } from "@/lib/nip07";
import { publishToRelays } from "@/lib/utils";

interface FollowButtonProps {
  pubkey: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "ghost";
  className?: string;
  onError?: (error: string) => void;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({
  pubkey,
  size = "md",
  variant = "default",
  className = "",
  onError,
  onFollowChange,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      try {
        if (typeof window === "undefined" || !window.nostr) {
          setIsFollowing(false);
          setIsLoading(false);

          return;
        }

        const userPubkey = await getUserPubkey();

        if (!userPubkey) {
          setIsFollowing(false);
          setIsLoading(false);

          return;
        }

        setIsLoading(true);

        getFollowsEvent(userPubkey, (followData) => {
          const following = followData?.event.tags
            .filter((tag) => tag[0] === "p")
            .map((tag) => tag[1])
            .includes(pubkey);

          setIsLoading(false);
          setIsFollowing(following);
        });
      } catch (error) {
        console.error("Follow status check failed:", error);
        setIsLoading(false);
        setIsFollowing(false);
      }
    };

    checkFollowStatus();
  }, [pubkey]);

  const publishEvent = async (event: NostrEvent, relays: string[]) => {
    const result = await publishToRelays(event, relays);

    return result.some((r) => r.success);
  };

  const handleFollowToggle = async () => {
    onError?.("");

    try {
      const toggleFollow = async () => {
        const userPubkey = await getUserPubkey();

        if (!userPubkey) {
          onError?.("Nostr uyumlu bir tarayıcı/eklenti kullanınız.");

          return;
        }

        setIsLoading(true);

        getFollowsEvent(userPubkey, async (followData) => {
          if (!followData) {
            onError?.("Takip listesi bulunamadı.");
            setIsLoading(false);

            return;
          }

          const following = followData.event.tags
            .filter((tag) => tag[0] === "p")
            .map((tag) => tag[1])
            .includes(pubkey);

          const newFollowTags = following
            ? followData.event.tags.filter(
                (t) => t[0] === "p" && t[1] !== pubkey,
              )
            : [...(followData.event.tags || []), ["p", pubkey]];

          const event = {
            kind: 3,
            tags: newFollowTags,
            content: "",
            created_at: Math.floor(Date.now() / 1000),
          };

          const signedEvent = await signEventByNip07(event);

          if (!signedEvent) {
            onError?.("Nostr uyumlu bir tarayıcı/eklenti kullanınız.");
            setIsFollowing(false);
            setIsLoading(false);

            return;
          }

          const published = await publishEvent(
            signedEvent,
            followData.followRelays,
          );

          if (!published) {
            onError?.("Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
            setIsFollowing(false);
            setIsLoading(false);

            return;
          }

          setIsLoading(true);

          // Refresh follow status
          getFollowsEvent(userPubkey, (followData) => {
            const following = followData?.event.tags
              .filter((tag) => tag[0] === "p")
              .map((tag) => tag[1])
              .includes(pubkey);

            setIsFollowing(following);
            onFollowChange?.(following);
            setIsLoading(false);
          });
        });
      };

      toggleFollow();
    } catch (error) {
      console.error("Follow toggle failed:", error);
      setIsLoading(false);
      onError?.("Bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.");
    }
  };

  // Don't show button if user is not logged in
  if (typeof window === "undefined" || !window.nostr) {
    return null;
  }

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

  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case "outline":
        return "border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300";
      case "ghost":
        return "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300";
      default:
        return "bg-blue-600 hover:bg-blue-700 text-white";
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={`inline-flex items-center ${getSizeClasses()} font-medium rounded-lg cursor-not-allowed bg-gray-400 text-white ${className}`}
      >
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        Yükleniyor...
      </button>
    );
  }

  return (
    <button
      onClick={handleFollowToggle}
      className={`inline-flex items-center ${getSizeClasses()} font-medium rounded-lg transition-colors ${getVariantClasses()} ${className}`}
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
