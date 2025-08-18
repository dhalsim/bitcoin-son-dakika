import { Loader2, Rocket, AlertCircle } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNostrAuth } from "@/contexts/NostrAuthContext";

import { createNIP98Auth } from "./utils";

export default function DeployTrigger() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const { getPublicKey, signEvent } = useNostrAuth();

  const triggerDeploy = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/api/admin-panel`;
      const authHeader = await createNIP98Auth("POST", url, getPublicKey, signEvent);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ action: "trigger-deploy" }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(result.error || "Deploy tetikleme başarısız");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Deploy tetikleme hatası");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          Site Deployment
        </CardTitle>
        <CardDescription>Değişiklikleri canlı siteye uygula</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {success && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-300">
              Deploy başarıyla tetiklendi! Site birkaç dakika içinde güncellenecek.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-4">
          <Button onClick={triggerDeploy} disabled={loading} className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            {loading ? "Deploy Tetikleniyor..." : "Deploy Tetikle"}
          </Button>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Son değişiklikleri canlı siteye uygular
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
