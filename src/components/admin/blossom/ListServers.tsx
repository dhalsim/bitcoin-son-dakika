import { useState, useEffect } from "react";
import { Clock, Save, CheckSquare, Square } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const handleSelectAll = () => {
    setSelectedServers(new Set(BLOSSOM_SERVERS));
    setHasChanges(true);
  };

  const handleUnselectAll = () => {
    setSelectedServers(new Set());
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);

    await performAction({
      action: "update-blossom-servers",
      servers: Array.from(selectedServers),
      lastUpdated,
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
          <div className="flex items-center gap-1">
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <CheckSquare className="h-3 w-3" />
              Tümünü Seç
            </Button>
            <Button
              onClick={handleUnselectAll}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Square className="h-3 w-3" />
              Tümünü Kaldır
            </Button>
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Kaydediliyor..." : "Sunucu Seçimini Kaydet"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {BLOSSOM_SERVERS.map((server) => {
          const isSelected = selectedServers.has(server);

          return (
            <div
              key={server}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                isSelected
                  ? "bg-green-100 border-green-300"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleServerToggle(server, checked as boolean)}
                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 border-gray-400"
              />
              <span
                className={`text-sm font-mono ${isSelected ? "text-green-800" : "text-gray-700"}`}
              >
                {server}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
