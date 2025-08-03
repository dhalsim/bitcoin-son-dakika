import { AvatarImage } from "@radix-ui/react-avatar";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from "react";

import type { ProfileItem } from "@/lib/nip01";
import { getProfiles } from "@/lib/nip01";

// Stable style object to prevent re-renders
const avatarImageStyle = {
  objectFit: "cover" as const,
};

// URL redirect cache to avoid extra network requests
const redirectCache = new Map<string, string>();
const resolvingUrls = new Set<string>();

// Function to resolve redirects and cache the final URL
const resolveRedirect = async (url: string): Promise<string> => {
  // Check if we already have the resolved URL cached
  if (redirectCache.has(url)) {
    return redirectCache.get(url)!;
  }

  // Check if we're already resolving this URL
  if (resolvingUrls.has(url)) {
    // Wait for the resolution to complete
    return new Promise((resolve) => {
      const checkCache = () => {
        if (redirectCache.has(url)) {
          resolve(redirectCache.get(url)!);
        } else {
          setTimeout(checkCache, 50);
        }
      };

      checkCache();
    });
  }

  resolvingUrls.add(url);

  try {
    // Use fetch to follow redirects and get the final URL
    const response = await fetch(url, {
      method: "HEAD", // Only get headers, not the full image
      mode: "cors",
      redirect: "follow",
    });

    const finalUrl = response.url;

    // Cache the resolved URL
    redirectCache.set(url, finalUrl);

    return finalUrl;
  } catch (error) {
    console.warn("Failed to resolve redirect for:", url, error);
    // If resolution fails, return the original URL
    redirectCache.set(url, url);

    return url;
  } finally {
    resolvingUrls.delete(url);
  }
};

// Utility function to pre-resolve URLs for better performance
const preResolveUrls = async (urls: string[]): Promise<void> => {
  const promises = urls.map((url) => resolveRedirect(url));
  await Promise.allSettled(promises);
};

// Memoized AvatarImage component with custom comparison
const MemoizedAvatarImage = memo(
  ({ src, alt, key }: { src: string; alt: string; key: string }) => (
    <AvatarImage
      key={key}
      src={src}
      alt={alt}
      loading="lazy"
      style={avatarImageStyle}
      crossOrigin="anonymous"
    />
  ),
  (prevProps, nextProps) => {
    // Only re-render if src, alt, or key changes
    return (
      prevProps.src === nextProps.src &&
      prevProps.alt === nextProps.alt &&
      prevProps.key === nextProps.key
    );
  },
);

MemoizedAvatarImage.displayName = "MemoizedAvatarImage";

interface ProfileContextType {
  profiles: Map<string, ProfileItem>;
  getProfile: (pubkey: string) => ProfileItem | null;
  profileImages: Map<string, React.ReactNode>;
  getProfileImage: (pubkey: string) => React.ReactNode | null;
  requestProfiles: (pubkeys: string[]) => void;
  isLoading: (pubkey: string) => boolean;
  // Debug function to check redirect cache
  getRedirectCacheInfo: () => { size: number; entries: [string, string][] };
}

const ProfileContext = createContext<ProfileContextType | null>(null);

interface ProfileProviderProps {
  children: React.ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [profiles, setProfiles] = useState<Map<string, ProfileItem>>(new Map());
  const [profileImages, setProfileImages] = useState<
    Map<string, React.ReactNode>
  >(new Map());
  const [loadingPubkeys, setLoadingPubkeys] = useState<Set<string>>(new Set());
  const subscriptionRef = useRef<(() => void) | null>(null);
  const requestedPubkeys = useRef<Set<string>>(new Set());

  const getDisplayName = (profile: ProfileItem, pubkey: string) =>
    profile.display_name || `${pubkey.slice(0, 8)}...`;

  // Helper function to create cache key
  const getCacheKey = (pubkey: string, created_at: number): string => {
    return `${pubkey}_${created_at}`;
  };

  const updateProfile = useCallback(
    async (pubkey: string, profile: ProfileItem) => {
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

      setProfileImages((prev) => {
        const newMap = new Map(prev);

        const displayName = getDisplayName(profile, pubkey);
        const originalAvatarUrl =
          profile.picture || `https://robohash.org/${pubkey}`;
        const cacheKey = getCacheKey(pubkey, profile.created_at);

        // Resolve redirects and cache the final URL
        resolveRedirect(originalAvatarUrl).then((resolvedUrl) => {
          // Update the profile image with the resolved URL
          setProfileImages((currentMap) => {
            const updatedMap = new Map(currentMap);
            updatedMap.set(
              cacheKey,
              <MemoizedAvatarImage
                key={`avatar-${pubkey}-${profile.created_at}`}
                src={resolvedUrl}
                alt={displayName}
              />,
            );

            return updatedMap;
          });
        });

        // Pre-resolve URLs for better performance
        preResolveUrls([originalAvatarUrl]);

        // Initially set with the original URL, will be updated with resolved URL
        newMap.set(
          cacheKey,
          <MemoizedAvatarImage
            key={`avatar-${pubkey}-${profile.created_at}`}
            src={originalAvatarUrl}
            alt={displayName}
          />,
        );

        return newMap;
      });
    },
    [],
  );

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

      const cleanup = getProfiles({
        authors: allRequestedPubkeys,
        onUpdate: updateProfile,
        oneose: () => {},
        onclose: (reasons) => {
          const nonEoseReasons = reasons.filter(
            (r) =>
              r !== "closed automatically on eose" && r !== "closed by client",
          );

          if (nonEoseReasons.length > 0) {
            console.log("Profile subscription closed:", reasons);
          }
        },
      });

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

  const getProfileImage = useCallback(
    (pubkey: string): React.ReactNode | null => {
      const profile = profiles.get(pubkey);

      if (!profile) {
        return null;
      }

      const cacheKey = getCacheKey(pubkey, profile.created_at);

      return profileImages.get(cacheKey) || null;
    },
    [profiles, profileImages],
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
    profileImages,
    getProfileImage,
    requestProfiles,
    isLoading,
    // Debug function to check redirect cache
    getRedirectCacheInfo: () => ({
      size: redirectCache.size,
      entries: Array.from(redirectCache.entries()),
    }),
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

  useEffect(() => {
    if (pubkey && !getProfile(pubkey)) {
      requestProfiles([pubkey]);
    }
  }, [pubkey, getProfile, requestProfiles]);

  return getProfile(pubkey);
}

export function useProfileImage(pubkey: string): React.ReactNode | null {
  const { getProfileImage } = useProfileContext();

  return getProfileImage(pubkey);
}

export function useProfiles(pubkeys: string[]): Map<string, ProfileItem> {
  const { profiles, requestProfiles } = useProfileContext();

  useEffect(() => {
    // Only request profiles that are not already in the global cache
    const missingPubkeys = pubkeys.filter((pubkey) => !profiles.has(pubkey));

    if (missingPubkeys.length > 0) {
      requestProfiles(missingPubkeys);
    }
  }, [pubkeys, profiles, requestProfiles]);

  const result = new Map<string, ProfileItem>();

  pubkeys.forEach((pubkey) => {
    const profile = profiles.get(pubkey);
    if (profile) {
      result.set(pubkey, profile);
    }
  });

  return result;
}

// Test function to verify redirect resolution (for debugging)
const testRedirectResolution = async (url: string): Promise<void> => {
  console.log("Testing redirect resolution for:", url);
  const resolved = await resolveRedirect(url);
  console.log("Resolved URL:", resolved);
  if (url !== resolved) {
    console.log("✅ Redirect detected and cached!");
  } else {
    console.log("ℹ️ No redirect detected");
  }
};

// Expose test function globally for debugging
if (typeof window !== "undefined") {
  (window as any).testRedirectResolution = testRedirectResolution;
  (window as any).getRedirectCacheInfo = () => ({
    size: redirectCache.size,
    entries: Array.from(redirectCache.entries()),
  });
}
