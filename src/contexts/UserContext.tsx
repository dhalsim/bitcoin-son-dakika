import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import { getProfiles, type ProfileItem } from "@/lib/nip01";
import { getFollowsEvent } from "@/lib/nip02";
import { fetchNip65Relays } from "@/lib/nip65";
import { useNostrAuth } from "./NostrAuthContext";

export const DEFAULT_READ_RELAYS = [
  "wss://relay.nostr.band/",
  "wss://relay.damus.io/",
  "wss://nos.lol/",
  "wss://relay.primal.net/",
  "wss://relay.snort.social/",
  "wss://nostr.bitcoiner.social/",
  "wss://nostr.mom/",
  "wss://nostr-pub.wellorder.net/",
  "wss://relay.nos.social/",
];

const DEFAULT_WRITE_RELAYS = [
  "wss://relay.damus.io/",
  "wss://relay.primal.net/",
  "wss://relay.snort.social/",
  "wss://nostr.bitcoiner.social/",
  "wss://nostr.mom/",
];

type UserRelays = {
  readRelays: string[];
  writeRelays: string[];
  isLoading: boolean;
  error: string | null;
};

type UserFollowings = {
  eventTags: string[][];
  pubkeys: string[];
  isLoading: boolean;
  error: string | null;
};

type UserProfile = {
  pubkey: string | null;
  profile: ProfileItem | null;
  isLoading: boolean;
  error: string | null;
};

interface UserContextType {
  userRelays: UserRelays;
  userFollowings: UserFollowings;
  userProfile: UserProfile;
  refreshFollowings: () => void;
  refreshProfile: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { getPublicKey, provider } = useNostrAuth();

  const [userRelays, setUserRelays] = useState<UserRelays>({
    readRelays: DEFAULT_READ_RELAYS,
    writeRelays: DEFAULT_WRITE_RELAYS,
    isLoading: false,
    error: null,
  });

  const [userFollowings, setUserFollowings] = useState<UserFollowings>({
    eventTags: [],
    pubkeys: [],
    isLoading: false,
    error: null,
  });

  const [userProfile, setUserProfile] = useState<UserProfile>({
    pubkey: null,
    profile: null,
    isLoading: false,
    error: null,
  });

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      setUserProfile((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // getPublicKey will handle login modal internally if needed

        const pubkey = await getPublicKey({ reason: "Profil yükleme" });

        if (!pubkey) {
          setUserProfile({
            pubkey: null,
            profile: null,
            isLoading: false,
            error: "Kullanıcı profili yüklenemedi - giriş yapılmadı",
          });

          return;
        }

        // Fetch user profile
        getProfiles({
          authors: [pubkey],
          onUpdate: (profiles) => {
            if (!profiles) {
              return;
            }

            setUserProfile({
              pubkey,
              profile: profiles.get(pubkey) || null,
              isLoading: false,
              error: null,
            });
          },
        });
      } catch (err) {
        console.error("Error loading user profile:", err);

        setUserProfile((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load user profile",
        }));
      }
    };

    // Only run if we have a provider (user is logged in)
    if (provider) {
      loadUserProfile();
    } else {
      // Set default state when no provider
      setUserProfile({
        pubkey: null,
        profile: null,
        isLoading: false,
        error: "Kullanıcı profili yüklenemedi - giriş yapılmadı",
      });
    }
  }, [provider]); // Only depend on provider changes

  // Load user relays
  useEffect(() => {
    const loadUserRelays = async () => {
      setUserRelays((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // getPublicKey will handle login modal internally if needed

        const pubkey = await getPublicKey({ reason: "Relay yapılandırması" });

        if (!pubkey) {
          // If no user pubkey, just use default relays
          setUserRelays({
            readRelays: DEFAULT_READ_RELAYS,
            writeRelays: [],
            isLoading: false,
            error: "Relay yapılandırması yüklenemedi - giriş yapılmadı",
          });

          return;
        }

        fetchNip65Relays(pubkey, false, async (nip65Relays) => {
          // Try to get relays from provider first, fallback to nip07 helper
          const nip07Relays = provider?.hasCapability("getRelays")
            ? await provider.getRelays()
            : { readRelays: [], writeRelays: [] };

          let readRelays = new Set([
            ...(nip65Relays?.readRelays || []),
            ...(nip07Relays?.readRelays || []),
          ]);

          if (readRelays.size === 0) {
            readRelays = new Set(DEFAULT_READ_RELAYS);
          }

          let writeRelays = new Set([
            ...(nip65Relays?.writeRelays || []),
            ...(nip07Relays?.writeRelays || []),
          ]);

          if (writeRelays.size === 0) {
            writeRelays = new Set(DEFAULT_WRITE_RELAYS);
          }

          setUserRelays({
            readRelays: Array.from(readRelays),
            writeRelays: Array.from(writeRelays),
            isLoading: false,
            error: null,
          });
        });
      } catch (err) {
        console.error("Error loading user relays:", err);
        setUserRelays({
          readRelays: DEFAULT_READ_RELAYS,
          writeRelays: DEFAULT_WRITE_RELAYS,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load user relays",
        });
      }
    };

    // Only run if we have a provider (user is logged in)
    if (provider) {
      loadUserRelays();
    } else {
      // Set default state when no provider
      setUserRelays({
        readRelays: DEFAULT_READ_RELAYS,
        writeRelays: [],
        isLoading: false,
        error: "Relay yapılandırması yüklenemedi - giriş yapılmadı",
      });
    }
  }, [provider]); // Only depend on provider changes

  // Load user followings when relays are loaded
  useEffect(() => {
    const loadUserFollowings = async () => {
      // Only load followings if relays are loaded and not failed
      if (userRelays.isLoading || userRelays.error || userRelays.writeRelays.length === 0) {
        return;
      }

      setUserFollowings((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // getPublicKey will handle login modal internally if needed

        const pubkey = await getPublicKey({ reason: "Takip listesi yükleme" });

        if (!pubkey) {
          setUserFollowings({
            eventTags: [],
            pubkeys: [],
            isLoading: false,
            error: "Takip listesi yüklenemedi - giriş yapılmadı",
          });

          return;
        }

        getFollowsEvent(pubkey, userRelays.writeRelays, (followData) => {
          if (!followData) {
            setUserFollowings({
              eventTags: [],
              pubkeys: [],
              isLoading: false,
              error: null,
            });

            return;
          }

          const pubkeys = followData.event.tags
            .filter((tag) => tag[0] === "p")
            .map((tag) => tag[1]);

          setUserFollowings({
            eventTags: followData.event.tags,
            pubkeys,
            isLoading: false,
            error: null,
          });
        });
      } catch (err) {
        console.error("Error loading user followings:", err);
        setUserFollowings({
          eventTags: [],
          pubkeys: [],
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load user followings",
        });
      }
    };

    // Only run if we have a provider and relays are loaded
    if (
      provider &&
      !userRelays.isLoading &&
      !userRelays.error &&
      userRelays.writeRelays.length > 0
    ) {
      loadUserFollowings();
    } else if (!provider) {
      // Set default state when no provider
      setUserFollowings({
        eventTags: [],
        pubkeys: [],
        isLoading: false,
        error: "Takip listesi yüklenemedi - giriş yapılmadı",
      });
    }
  }, [provider, userRelays.isLoading, userRelays.error, userRelays.writeRelays]); // Depend on provider and relay state changes

  const refreshFollowings = () => {
    // Trigger a refresh by setting loading state
    setUserFollowings((prev) => ({ ...prev, isLoading: true }));
  };

  const refreshProfile = () => {
    // Trigger a refresh by setting loading state
    setUserProfile((prev) => ({ ...prev, isLoading: true }));
  };

  const contextValue: UserContextType = {
    userRelays,
    userFollowings,
    userProfile,
    refreshFollowings,
    refreshProfile,
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
}

export function useUserContext(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
}

// Convenience hook for user relays
export function useUserReadRelays(): string[] {
  return useUserContext().userRelays.readRelays;
}

export function useUserWriteRelays(): string[] {
  return useUserContext().userRelays.writeRelays;
}

// Hook for loading state
export function useUserRelaysLoading(): boolean {
  return useUserContext().userRelays.isLoading;
}

// Hook for error state
export function useUserRelaysError(): string | null {
  return useUserContext().userRelays.error;
}

// Hook for user followings
export function useUserFollowings(): UserFollowings {
  return useUserContext().userFollowings;
}

// Hook for refreshing followings
export function useRefreshFollowings(): () => void {
  return useUserContext().refreshFollowings;
}

// Hook for user profile
export function useUserProfile(): UserProfile {
  return useUserContext().userProfile;
}

// Hook for refreshing profile
export function useRefreshProfile(): () => void {
  return useUserContext().refreshProfile;
}
