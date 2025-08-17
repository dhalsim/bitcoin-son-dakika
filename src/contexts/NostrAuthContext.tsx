import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import type { NostrEvent } from "nostr-tools";

import { getCache } from "@/lib/cache";
import { LoginModal } from "@/components/auth/LoginModal";
import { createNip07Provider, Nip07Relays } from "@/lib/providers/Nip07Provider";

export type NostrProviderMethod = "nip07" | "nip46" | "nsec" | "nostrconnect" | "none";

export interface NostrProvider<T extends NostrProviderMethod> {
  method: T;
  isReady(): Promise<boolean>;

  // Identity
  getPublicKey(): Promise<string>;

  // Signing
  signEvent(event: Omit<NostrEvent, "id" | "sig" | "pubkey">): Promise<NostrEvent>;

  // Optional capabilities
  getRelays?(): Promise<Nip07Relays>;

  hasCapability(cap: "getRelays" | "signEvent"): boolean;
  dispose?(): void;
}

export type LoginResult<T extends NostrProviderMethod> =
  | {
      success: true;
      provider: NostrProvider<T>;
    }
  | {
      success: false;
      provider: null;
    };

export type AuthIntent = "log_in" | "read_pubkey" | "sign_event";

export interface NostrAuthContextValue<T extends NostrProviderMethod> {
  provider: NostrProvider<T>;
  isLoggedIn: boolean;

  // Provider lifecycle
  loginWithNip07(): Promise<LoginResult<T>>;
  loginWithNsec(nsec: string): Promise<LoginResult<T>>; // future
  loginWithNip46(uri: string): Promise<LoginResult<T>>; // future
  logout(): void;

  // Core actions (auto-triggers modal if needed)
  getPublicKey(options?: { reason?: string }): Promise<string | null>;
  signEvent(
    event: Omit<NostrEvent, "id" | "sig" | "pubkey">,
    options?: { reason?: string },
  ): Promise<NostrEvent>;

  // Modal control
  requestLogin(intent: AuthIntent, options?: { reason?: string }): Promise<LoginResult<T>>;

  // Utility function for components that need to show login modal
  showLoginModal(intent: AuthIntent, options?: { reason?: string }): Promise<LoginResult<T>>;
}

const NostrAuthContext = createContext<NostrAuthContextValue<NostrProviderMethod> | null>(null);

interface NostrAuthProviderProps {
  children: ReactNode;
}

export function NostrAuthProvider({ children }: NostrAuthProviderProps) {
  const [provider, setProvider] = useState<NostrProvider<NostrProviderMethod> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAuthRequest, setPendingAuthRequest] = useState<{
    intent: AuthIntent;
    options?: { reason?: string };
    resolve: (loginResult: LoginResult<NostrProviderMethod>) => void;
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
        } else {
          throw new Error(`Unsupported provider method: ${loginState.method}`);
        }
      }
    } catch (error) {
      console.warn("Failed to load auth state from cache:", error);
    }
  }, []);

  // No need to persist suppress state changes - we read directly from cache

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

  const loginWithNip07 = useCallback(async (): Promise<LoginResult<NostrProviderMethod>> => {
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

  const loginWithNsec = async (nsec: string): Promise<LoginResult<NostrProviderMethod>> => {
    // TODO: Implement when NsecProvider is created
    return { success: false, provider: null };
  };

  const loginWithNip46 = async (uri: string): Promise<LoginResult<NostrProviderMethod>> => {
    // TODO: Implement when Nip46Provider is created
    return { success: false, provider: null };
  };

  const logout = useCallback(() => {
    if (provider?.dispose) {
      provider.dispose();
    }

    setProvider(null);

    clearLoginState();
  }, [provider]);

  const getPublicKey = useCallback(
    async (options?: { reason?: string }): Promise<string | null> => {
      if (provider && isLoggedIn) {
        try {
          return await provider.getPublicKey();
        } catch (error) {
          console.error("Failed to get public key from provider:", error);

          return null;
        }
      }

      // Request login for pubkey read
      const { success, provider: loginProvider } = await requestLogin("read_pubkey", options);

      if (success && loginProvider) {
        try {
          return await loginProvider.getPublicKey();
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
    async (
      event: Omit<NostrEvent, "id" | "sig" | "pubkey">,
      options?: { reason?: string },
    ): Promise<NostrEvent> => {
      if (provider && isLoggedIn) {
        try {
          return await provider.signEvent(event);
        } catch (error) {
          console.error("Failed to sign event with provider:", error);
          throw error;
        }
      }

      // Always request login for signing (ignore suppression)
      const { success, provider: loginProvider } = await requestLogin("sign_event", options);
      if (success && loginProvider) {
        try {
          return await loginProvider.signEvent(event);
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
    async (
      intent: AuthIntent,
      options?: { reason?: string },
    ): Promise<LoginResult<NostrProviderMethod>> => {
      return new Promise((resolve) => {
        setPendingAuthRequest({ intent, options, resolve });
        setIsModalOpen(true);
      });
    },
    [],
  );

  const handleModalClose = useCallback(
    (result: LoginResult<NostrProviderMethod>) => {
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
    async (
      intent: AuthIntent,
      options?: { reason?: string },
    ): Promise<LoginResult<NostrProviderMethod>> => {
      return requestLogin(intent, options);
    },
    [requestLogin],
  );

  const contextValue: NostrAuthContextValue<NostrProviderMethod> = {
    provider,
    isLoggedIn,
    loginWithNip07,
    loginWithNsec,
    loginWithNip46,
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
}

export function useNostrAuth(): NostrAuthContextValue<NostrProviderMethod> {
  const context = useContext(NostrAuthContext);
  if (!context) {
    throw new Error("useNostrAuth must be used within a NostrAuthProvider");
  }
  return context;
}
