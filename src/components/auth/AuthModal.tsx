import { useState } from "react";
import { Key, UserPlus, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthIntent, LoginResult } from "@/contexts/NostrAuthContext";

import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

interface AuthModalProps {
  open: boolean;
  onClose: (result: LoginResult) => void;
  intent: AuthIntent;
  reason?: string;
}

type AuthMode = "login" | "signup";

export function AuthModal({ open, onClose, intent, reason }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = (result: LoginResult) => {
    onClose(result);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleClose = () => {
    onClose({ success: false, provider: null });
  };

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  };

  const handleBackToLogin = () => {
    setMode("login");
    setError(null);
  };

  const getReasonText = () => {
    if (reason) return reason;

    switch (intent) {
      case "read_pubkey":
        return "Kişiselleştirilmiş deneyim için genel anahtarınıza ihtiyaç var.";
      case "sign_event":
        return "Bu işlemi imzalamak için giriş yapmalısınız.";
      case "log_in":
        return "Bağlanmak için bir yöntem seçin";
      default:
        return assertUnreachable(intent);
    }
  };

  const assertUnreachable = (value: never): never => {
    throw new Error(`Unreachable code: ${value}`);
  };

  const getTitleText = () => {
    switch (intent) {
      case "read_pubkey":
        return "Giriş Gerekli";
      case "sign_event":
        return "İmzalama Gerekli";
      case "log_in":
        return mode === "login" ? "Giriş Yap" : "Hesap Oluştur";
      default:
        return assertUnreachable(intent);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {mode === "login" ? <Key className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
            {getTitleText()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto pr-2">
          {/* Reason */}
          <p className="text-sm text-muted-foreground">{getReasonText()}</p>

          {/* Mode Selection */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              variant={mode === "login" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => handleModeChange("login")}
            >
              <Key className="h-4 w-4 mr-2" />
              Nostr ile Giriş
            </Button>
            <Button
              variant={mode === "signup" ? "default" : "ghost"}
              size="sm"
              className="flex-1"
              onClick={() => handleModeChange("signup")}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nostr'e Yeni Gelen
            </Button>
          </div>

          {/* New to Nostr Alert */}
          {mode === "signup" && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-blue-800">
                <strong>Nostr nedir?</strong> Nostr, merkezi olmayan sosyal medya protokolüdür.
                Hesabınızı oluşturduktan sonra tüm Nostr uygulamalarında kullanabilirsiniz.
              </AlertDescription>
            </Alert>
          )}

          {/* Form Content */}
          {mode === "login" ? (
            <LoginForm onSuccess={handleSuccess} onError={handleError} />
          ) : (
            <SignupForm onSuccess={handleSuccess} onError={handleBackToLogin} />
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 flex-shrink-0">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                İptal
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
