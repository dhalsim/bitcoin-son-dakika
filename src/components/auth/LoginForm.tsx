import { useState } from "react";
import { Key, Smartphone } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginResult } from "@/contexts/NostrAuthContext";
import { Nip07Auth } from "./Nip07Auth";
import { NostrConnectAuth } from "./NostrConnectAuth";

interface LoginFormProps {
  onSuccess: (result: LoginResult) => void;
  onError: (errorMessage: string) => void;
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [activeTab, setActiveTab] = useState("nip07");

  const handleSuccess = (result: LoginResult) => {
    onSuccess(result);
  };

  const handleError = (errorMessage: string) => {
    onError(errorMessage);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="nip07" className="text-xs">
            Eklenti (NIP-07)
          </TabsTrigger>
          <TabsTrigger value="nostrconnect" className="text-xs">
            NostrConnect
          </TabsTrigger>
          <TabsTrigger value="nsec" disabled className="text-xs">
            Nsec
          </TabsTrigger>
          <TabsTrigger value="nip46" disabled className="text-xs">
            Bunker (NIP-46)
          </TabsTrigger>
        </TabsList>

        {/* NIP-07 Tab */}
        <TabsContent value="nip07" className="space-y-4">
          <Nip07Auth onSuccess={handleSuccess} onError={handleError} />
        </TabsContent>

        {/* Nsec Tab */}
        <TabsContent value="nsec" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nsec ile giriş yakında gelecek</p>
            <p className="text-xs mt-2">Gizli anahtarınızı güvenli bir şekilde saklayın</p>
          </div>
        </TabsContent>

        {/* NIP-46 Tab */}
        <TabsContent value="nip46" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Bunker (NIP-46) yakında gelecek</p>
            <p className="text-xs mt-2">Mobil cihazınızdan güvenli imzalama</p>
          </div>
        </TabsContent>

        {/* NostrConnect Tab */}
        <TabsContent value="nostrconnect" className="space-y-4">
          <NostrConnectAuth onSuccess={handleSuccess} onError={handleError} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
