import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { EventTemplate, NostrEvent } from "nostr-tools";

import { getCache } from "@/lib/cache";
import { LoginModal } from "@/components/auth/LoginModal";
import { createNip07Provider, Nip07Relays } from "@/lib/providers/Nip07Provider";
import { createNostrConnectProvider, NostrConnectData } from "@/lib/providers/NostrConnectProvider";

export type NostrProviderMethod = "nip07" | "nip46" | "nsec" | "nostrconnect" | "none";

export type ProviderCapability = "getRelays" | "signEvent" | "getPublicKey";

export type NostrProvider = {
  method: NostrProviderMethod;
  isReady(): Promise<boolean>;
  getPublicKey: GetPublicKey;
  signEvent: SignEvent;
  getRelays?(): Promise<Nip07Relays>;
  hasCapability(cap: ProviderCapability): boolean;
  dispose?(): void;
};

export type LoginResult =
  | {
      success: true;
      provider: NostrProvider;
    }
  | {
      success: false;
      provider: null;
    };

export type AuthIntent = "log_in" | "read_pubkey" | "sign_event";

export type SignEventResult = { signedEvent: NostrEvent; provider: NostrProvider };
export type SignEventParams = {
  event: EventTemplate;
  options?: { reason?: string };
};
export type SignEvent = (params: SignEventParams) => Promise<SignEventResult>;

export type GetPublicKeyParams = { options?: { reason?: string } };
export type GetPublicKey = (params: GetPublicKeyParams) => Promise<string | null>;

export interface NostrAuthContextValue {
  provider: NostrProvider;
  isLoggedIn: boolean;
  isInitialized: boolean;

  // Provider lifecycle
  loginWithNip07(): Promise<LoginResult>;
  loginWithNsec(nsec: string): Promise<LoginResult>; // future
  loginWithNip46(uri: string): Promise<LoginResult>; // future
  loginWithNostrConnect(data: NostrConnectData): Promise<LoginResult>; // future
  logout(): void;

  // Core actions (auto-triggers modal if needed)
  getPublicKey: GetPublicKey;
  signEvent: SignEvent;

  // Modal control
  requestLogin(intent: AuthIntent, options?: { reason?: string }): Promise<LoginResult>;

  // Utility function for components that need to show login modal
  showLoginModal(intent: AuthIntent, options?: { reason?: string }): Promise<LoginResult>;
}

const NostrAuthContext = createContext<NostrAuthContextValue | null>(null);

interface NostrAuthProviderProps {
  children: ReactNode;
}

// Use const function declaration for better HMR support
const NostrAuthProvider = React.memo(({ children }: NostrAuthProviderProps) => {
  const [provider, setProvider] = useState<NostrProvider | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingAuthRequest, setPendingAuthRequest] = useState<{
    intent: AuthIntent;
    options?: { reason?: string };
    resolve: (loginResult: LoginResult) => void;
  } | null>(null);

  const isLoggedIn = useMemo(() => !!provider, [provider]);
  const cache = getCache();

  // Load persisted state on mount
  useEffect(() => {
    try {
      const loginState = cache.getAuthLoginState();

      if (loginState && loginState.loggedIn) {
        if (loginState.method === "nip07") {
          setProvider(createNip07Provider());
        } else if (loginState.method === "nostrconnect") {
          setProvider(createNostrConnectProvider(loginState.data));
        } else {
          throw new Error(`Unsupported provider method: ${loginState.method}`);
        }
      }
    } catch (error) {
      console.warn("Failed to load auth state from cache:", error);
    } finally {
      // Mark as initialized regardless of success/failure
      setIsInitialized(true);
    }
  }, []);

  // Define these functions before the useEffect that uses them
  const persistLoginState = useCallback(
    (state: { method: NostrProviderMethod; loggedIn: boolean; data?: any }) => {
      try {
        cache.setAuthLoginState(state);
      } catch (error) {
        console.warn("Failed to save login state to cache:", error);
      }
    },
    [],
  );

  const clearLoginState = useCallback(() => {
    try {
      cache.deleteAuthLoginState();
    } catch (error) {
      console.warn("Failed to clear login state from cache:", error);
    }
  }, []);

  // Handle hot reload scenarios - re-initialize provider if needed
  useEffect(() => {
    if (isInitialized && provider) {
      // Check if the provider is still valid
      provider.isReady().catch(() => {
        // Provider is no longer valid, clear it
        console.warn("Provider no longer valid, clearing...");
        setProvider(null);
        clearLoginState();
      });
    }
  }, [isInitialized, provider, clearLoginState]);

  // Development environment: handle hot reload more gracefully
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      const handleBeforeUnload = () => {
        // Clear any pending state before page unload (hot reload)
        if (provider?.dispose) {
          provider.dispose();
        }
      };

      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }
  }, [provider]);

  // No need to persist suppress state changes - we read directly from cache

  const loginWithNip07 = useCallback(async (): Promise<LoginResult> => {
    try {
      const nip07Provider = createNip07Provider();
      const isReady = await nip07Provider.isReady();

      if (!isReady) {
        throw new Error("NIP-07 extension not ready");
      }

      setProvider(nip07Provider);

      persistLoginState({
        method: "nip07",
        loggedIn: true,
        data: {},
      });

      return { success: true, provider: nip07Provider };
    } catch (error) {
      console.error("Failed to login with NIP-07:", error);
      return { success: false, provider: null };
    }
  }, []);

  const loginWithNsec = async (nsec: string): Promise<LoginResult> => {
    // TODO: Implement when NsecProvider is created
    return { success: false, provider: null };
  };

  const loginWithNip46 = async (uri: string): Promise<LoginResult> => {
    // TODO: Implement when Nip46Provider is created
    return { success: false, provider: null };
  };

  const loginWithNostrConnect = useCallback(
    async (data: NostrConnectData): Promise<LoginResult> => {
      try {
        const nostrConnectProvider = createNostrConnectProvider(data);
        const isReady = await nostrConnectProvider.isReady();

        if (!isReady) {
          throw new Error("NostrConnect provider not ready");
        }

        setProvider(nostrConnectProvider);

        persistLoginState({
          method: "nostrconnect",
          loggedIn: true,
          data: data,
        });

        return { success: true, provider: nostrConnectProvider };
      } catch (error) {
        console.error("Failed to login with NostrConnect:", error);
        return { success: false, provider: null };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    if (provider?.dispose) {
      provider.dispose();
    }

    setProvider(null);

    clearLoginState();
  }, [provider, clearLoginState]);

  const getPublicKey = useCallback(
    async (params: GetPublicKeyParams): Promise<string | null> => {
      if (provider && isLoggedIn) {
        try {
          return await provider.getPublicKey(params);
        } catch (error) {
          console.error("Failed to get public key from provider:", error);

          return null;
        }
      }

      // Request login for pubkey read
      const { success, provider: loginProvider } = await requestLogin(
        "read_pubkey",
        params.options,
      );

      if (success && loginProvider) {
        try {
          return await loginProvider.getPublicKey(params);
        } catch (error) {
          console.error("Failed to get public key after login:", error);

          return null;
        }
      }

      return null;
    },
    [provider, isLoggedIn], // requestLogin is stable, no need to include
  );

  const signEvent = useCallback(
    async (params: SignEventParams): Promise<SignEventResult> => {
      if (provider && isLoggedIn) {
        try {
          return await provider.signEvent(params);
        } catch (error) {
          console.error("Failed to sign event with provider:", error);

          throw error;
        }
      }

      // Always request login for signing (ignore suppression)
      const { success, provider: loginProvider } = await requestLogin("sign_event", params.options);
      if (success && loginProvider) {
        try {
          return await loginProvider.signEvent(params);
        } catch (error) {
          console.error("Failed to sign event after login:", error);
          throw error;
        }
      }

      throw new Error("Login required for signing");
    },
    [provider, isLoggedIn], // requestLogin is stable, no need to include
  );

  const requestLogin = useCallback(
    async (intent: AuthIntent, options?: { reason?: string }): Promise<LoginResult> => {
      return new Promise((resolve) => {
        setPendingAuthRequest({ intent, options, resolve });
        setIsModalOpen(true);
      });
    },
    [],
  );

  const handleModalClose = useCallback(
    (result: LoginResult) => {
      if (pendingAuthRequest) {
        // Pass the full result through to the promise resolution
        pendingAuthRequest.resolve(result);
        setPendingAuthRequest(null);
      }

      setIsModalOpen(false);
    },
    [pendingAuthRequest],
  );

  const showLoginModal = useCallback(
    async (intent: AuthIntent, options?: { reason?: string }): Promise<LoginResult> => {
      return requestLogin(intent, options);
    },
    [requestLogin],
  );

  const contextValue: NostrAuthContextValue = {
    provider,
    isLoggedIn,
    isInitialized,
    loginWithNip07,
    loginWithNsec,
    loginWithNip46,
    loginWithNostrConnect,
    logout,
    getPublicKey,
    signEvent,
    requestLogin,
    showLoginModal,
  };

  return (
    <NostrAuthContext.Provider value={contextValue}>
      {children}
      <LoginModal
        open={isModalOpen}
        onClose={handleModalClose}
        intent={pendingAuthRequest?.intent || "read_pubkey"}
        reason={pendingAuthRequest?.options?.reason}
      />
    </NostrAuthContext.Provider>
  );
});

// Export the component for external use
export { NostrAuthProvider };

// Add display name for better debugging and HMR support
NostrAuthProvider.displayName = "NostrAuthProvider";

export function useNostrAuth(): NostrAuthContextValue {
  const context = useContext(NostrAuthContext);

  // During SSG or when context is not yet available, provide a fallback
  if (!context) {
    // Check if we're in a browser environment and component has mounted
    if (typeof window !== "undefined") {
      // In browser but context not available - this shouldn't happen normally
      // but can occur during hot reloading or context initialization
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "NostrAuth context not available in development mode, using fallback. This may indicate a provider setup issue or hot reload problem.",
        );
      } else {
        console.warn(
          "NostrAuth context not available, using fallback. This may indicate a provider setup issue.",
        );
      }
    }

    // Return a fallback context that won't crash the app
    // This allows the app to render during SSG or context initialization
    return {
      provider: {
        method: "none" as NostrProviderMethod,
        isReady: async () => false,
        getPublicKey: async () => null,
        signEvent: async () => {
          throw new Error("Provider not ready");
        },
        hasCapability: () => false,
      },
      isLoggedIn: false,
      isInitialized: false,
      loginWithNip07: async () => ({ success: false, provider: null }),
      loginWithNip46: async () => ({ success: false, provider: null }),
      loginWithNsec: async () => ({ success: false, provider: null }),
      loginWithNostrConnect: async () => ({ success: false, provider: null }),
      logout: () => {},
      getPublicKey: async () => null,
      signEvent: async () => {
        throw new Error("Provider not ready");
      },
      requestLogin: async () => ({ success: false, provider: null }),
      showLoginModal: async () => ({ success: false, provider: null }),
    };
  }

  return context;
}
