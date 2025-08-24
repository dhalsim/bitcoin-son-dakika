import { LogOut, Settings, User } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useUserProfile } from "@/contexts/UserContext";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

export function UserMenu() {
  const userProfile = useUserProfile();
  const { isLoggedIn, showLoginModal, logout } = useNostrAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Development environment: add safety checks for hot reload scenarios
  if (process.env.NODE_ENV === "development") {
    // Additional safety check for development hot reloads
    if (!userProfile || typeof userProfile !== "object") {
      console.warn("UserMenu: userProfile is invalid during development, showing fallback");
      return (
        <Button variant="outline" size="sm" className="hidden sm:flex" disabled={true}>
          <div className="animate-spin rounded-full h-4 w-4 border-b-current mr-2" />
          Yükleniyor...
        </Button>
      );
    }
  }

  // If profile is loading, show loading state
  if (userProfile.isLoading) {
    return (
      <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-gray-600 animate-spin" />
    );
  }

  // If no user is logged in, show login button
  if (!isLoggedIn || !userProfile.pubkey) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            setIsLoggingIn(true);

            const result = await showLoginModal("log_in", {
              reason: "Profil bilgilerinize erişim için giriş yapmalısınız.",
            });

            if (!result.success) {
              console.log("User cancelled login");
            }
          } catch (error) {
            console.error("Login error:", error);
          } finally {
            setIsLoggingIn(false);
          }
        }}
        disabled={isLoggingIn}
        className="hidden sm:flex"
      >
        {isLoggingIn ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-current mr-2" />
        ) : (
          <User className="h-4 w-4 mr-2" />
        )}
        {isLoggingIn ? "Giriş Yapılıyor..." : "Giriş Yap"}
      </Button>
    );
  }

  // If there's an error, show error state with retry option
  if (userProfile.error) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={async () => {
          try {
            setIsLoggingIn(true);

            const result = await showLoginModal("read_pubkey", {
              reason: "Profil bilgilerinize erişim için giriş yapmalısınız.",
            });

            if (!result.success) {
              console.log("User cancelled login");
            }
          } catch (error) {
            console.error("Login error:", error);
          } finally {
            setIsLoggingIn(false);
          }
        }}
        disabled={isLoggingIn}
        className="hidden sm:flex"
      >
        {isLoggingIn ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-current mr-2" />
        ) : (
          <User className="h-4 w-4 mr-2" />
        )}
        {isLoggingIn ? "Giriş Yapılıyor..." : "Yeniden Dene"}
      </Button>
    );
  }

  // Additional safety check - ensure we have a valid pubkey before rendering the menu
  if (!userProfile.pubkey) {
    return (
      <Button variant="outline" size="sm" className="hidden sm:flex" disabled={true}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-current mr-2" />
        Yükleniyor...
      </Button>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0 sm:flex">
          <ProfileAvatar
            pubkey={userProfile.pubkey}
            profile={userProfile.profile}
            size="sm"
            disablePopup={true}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center space-x-2 p-2">
          <ProfileAvatar
            pubkey={userProfile.pubkey}
            profile={userProfile.profile}
            size="md"
            disablePopup={true}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {userProfile.profile?.display_name ||
                userProfile.profile?.name ||
                (userProfile.pubkey ? `${userProfile.pubkey.slice(0, 8)}...` : "Unknown User")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userProfile.pubkey ? `${userProfile.pubkey.slice(0, 16)}...` : "No public key"}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            // Navigate to user profile page
            if (userProfile.pubkey) {
              window.open(`/profile/${userProfile.pubkey}`, "_blank");
            }
            setIsOpen(false);
          }}
        >
          <User className="h-4 w-4 mr-2" />
          Profilim
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            // TODO: Navigate to settings page, not implemented yet
            console.log("Settings clicked");

            // TODO: Implement notification seen event
            // {
            //   "kind": 30078,
            //   "content": "Records read time to sync notification status across devices.",
            //   "tags": [["d", "seen_notifications_at"]],
            //   "created_at": 1755948190,
            //   "pubkey": "6e64b83c1f674fb00a5f19816c297b6414bf67f015894e04dd4c657e94102ee8",
            //   "id": "33cd025a4158a7079909908ba5ea1c26bcb1ff9b81f84c801fd264bc45cd173c",
            //   "sig": "f0a095b5591cac9108aeb25f64ed755c3fb190a3e9a65879500ce8d754c1dd021ff081d107f7af7a80c4d6def86e5970391874acf51ffbdefea046377b88a66d"
            // }

            setIsOpen(false);
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Bildirimler
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            // TODO: Navigate to settings page, not implemented yet
            console.log("Settings clicked");

            setIsOpen(false);
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Ayarlar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            setIsOpen(false);
          }}
          className="text-red-600 dark:text-red-400"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Çıkış Yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
