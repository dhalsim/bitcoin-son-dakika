import { useState, useEffect } from "react";
import { Server, Clock, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import { UpdateBlossomServersPayload } from "@/types/admin";

const BLOSSOM_SERVERS = [
  "https://blossom.band",
  "https://blossom.primal.net",
  "https://nostr.download",
  "https://24242.io",
  "https://cdn.nostrcheck.me",
  "https://blossom.nostr.build",
];

interface ListServersProps {
  servers: string[];
  lastUpdated: number;
  performAction: (data: UpdateBlossomServersPayload) => Promise<any>;
}

export function ListServers({ servers, lastUpdated, performAction }: ListServersProps) {
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set(servers));
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("tr-TR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Update local state when servers prop changes
  useEffect(() => {
    setSelectedServers(new Set(servers));
    setHasChanges(false);
  }, [servers]);

  const handleServerToggle = (server: string, checked: boolean) => {
    const newSelectedServers = new Set(selectedServers);

    if (checked) {
      newSelectedServers.add(server);
    } else {
      newSelectedServers.delete(server);
    }

    setSelectedServers(newSelectedServers);

    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    await performAction({
      action: "update-blossom-servers",
      servers: Array.from(selectedServers),
      lastUpdated: Date.now(),
    });

    setHasChanges(false);
    setIsSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Blossom Sunucuları</h3>
          <p className="text-sm text-muted-foreground">
            {selectedServers.size} / {BLOSSOM_SERVERS.length} sunucu seçili
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(lastUpdated)}
          </Badge>
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Sunucu Seçimini Kaydet
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {BLOSSOM_SERVERS.map((server) => {
          const isSelected = selectedServers.has(server);

          return (
            <Card
              key={server}
              className={`hover:shadow-md transition-shadow ${
                isSelected ? "ring-2 ring-green-500 ring-opacity-50" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-medium">
                      {server.replace("https://", "").split(".")[0]}
                    </CardTitle>
                  </div>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleServerToggle(server, checked as boolean)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="break-all text-xs">{server}</CardDescription>
                <div className="mt-3 flex items-center gap-2">
                  <Badge
                    variant={isSelected ? "default" : "secondary"}
                    className={`text-xs ${isSelected ? "bg-green-500" : ""}`}
                  >
                    {isSelected ? "Seçili" : "Mevcut"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
