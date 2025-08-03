import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";

import type { ProfileItem } from "@/lib/nip01";
import { getProfiles } from "@/lib/nip01";

interface ProfileContextType {
  profiles: Map<string, ProfileItem>;
  getProfile: (pubkey: string) => ProfileItem | null;
  requestProfiles: (pubkeys: string[]) => void;
  isLoading: (pubkey: string) => boolean;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

interface ProfileProviderProps {
  children: React.ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profiles, setProfiles] = useState<Map<string, ProfileItem>>(new Map());
  const [loadingPubkeys, setLoadingPubkeys] = useState<Set<string>>(new Set());
  const subscriptionRef = useRef<(() => void) | null>(null);
  const requestedPubkeys = useRef<Set<string>>(new Set());

  const updateProfile = useCallback((pubkey: string, profile: ProfileItem) => {
    setProfiles((prev) => {
      const newMap = new Map(prev);
      newMap.set(pubkey, profile);

      return newMap;
    });

    // Remove from loading set
    setLoadingPubkeys((prev) => {
      const newSet = new Set(prev);
      newSet.delete(pubkey);

      return newSet;
    });
  }, []);

  const requestProfiles = useCallback(
    (pubkeys: string[]) => {
      if (pubkeys.length === 0) {
        return;
      }

      // Filter out pubkeys we already have or are already requesting
      const newPubkeys = pubkeys.filter((pubkey) => {
        return !requestedPubkeys.current.has(pubkey);
      });

      if (newPubkeys.length === 0) {
        return;
      }

      // Mark as requested and loading
      newPubkeys.forEach((pubkey) => {
        requestedPubkeys.current.add(pubkey);
      });

      setLoadingPubkeys((prev) => {
        const newSet = new Set(prev);
        newPubkeys.forEach((pubkey) => newSet.add(pubkey));

        return newSet;
      });

      // Close existing subscription if any
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }

      // Create new subscription with all requested pubkeys (including old ones)
      const allRequestedPubkeys = Array.from(requestedPubkeys.current);

      const cleanup = getProfiles(
        allRequestedPubkeys,
        updateProfile,
        (reasons) => {
          const nonEoseReasons = reasons.filter(
            (r) =>
              r !== "closed automatically on eose" && r !== "closed by client",
          );

          if (nonEoseReasons.length > 0) {
            console.log("Profile subscription closed:", reasons);
          }
        },
      );

      subscriptionRef.current = cleanup;
    },
    [updateProfile],
  );

  const getProfile = useCallback(
    (pubkey: string): ProfileItem | null => {
      return profiles.get(pubkey) || null;
    },
    [profiles],
  );

  const isLoading = useCallback(
    (pubkey: string): boolean => {
      return loadingPubkeys.has(pubkey);
    },
    [loadingPubkeys],
  );

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, []);

  const contextValue: ProfileContextType = {
    profiles,
    getProfile,
    requestProfiles,
    isLoading,
  };

  return (
    <ProfileContext.Provider value={contextValue}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextType {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }

  return context;
}

// Convenient hooks
export function useProfile(pubkey: string): ProfileItem | null {
  const { getProfile, requestProfiles } = useProfileContext();
  const requestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (pubkey && !getProfile(pubkey) && !requestedRef.current.has(pubkey)) {
      requestedRef.current.add(pubkey);
      requestProfiles([pubkey]);
    }
  }, [pubkey]); // Remove getProfile and requestProfiles from deps

  return getProfile(pubkey);
}

export function useProfiles(pubkeys: string[]): Map<string, ProfileItem> {
  const { profiles, requestProfiles } = useProfileContext();
  const requestedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const missingPubkeys = pubkeys.filter(
      (pubkey) => !profiles.has(pubkey) && !requestedRef.current.has(pubkey),
    );

    if (missingPubkeys.length > 0) {
      missingPubkeys.forEach((pubkey) => requestedRef.current.add(pubkey));
      requestProfiles(missingPubkeys);
    }
  }, [pubkeys]); // Remove profiles and requestProfiles from deps

  const result = new Map<string, ProfileItem>();
  pubkeys.forEach((pubkey) => {
    const profile = profiles.get(pubkey);
    if (profile) {
      result.set(pubkey, profile);
    }
  });

  return result;
}
