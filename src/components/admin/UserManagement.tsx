import { Loader2, Shield, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { validateNpub } from "./utils";

export default function UserManagement({
  adminUsers,
  editorUsers,
  performAction,
}: {
  adminUsers: string[];
  editorUsers: string[];
  performAction: (data: any) => Promise<any>;
}) {
  const [newAdminNpub, setNewAdminNpub] = useState("");
  const [newEditorNpub, setNewEditorNpub] = useState("");
  const [error, setError] = useState("");
  const [removingAdminKey, setRemovingAdminKey] = useState<string | null>(null);
  const [removingEditorKey, setRemovingEditorKey] = useState<string | null>(null);
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addingEditor, setAddingEditor] = useState(false);

  const onAddAdmin = async () => {
    if (!newAdminNpub.trim()) {
      return;
    }

    const result = validateNpub(newAdminNpub.trim());

    if (result.valid === false) {
      setError(result.error);

      return;
    }

    try {
      setAddingAdmin(true);

      setError("");

      await performAction({
        action: "add-admin-pubkey",
        pubkey: result.pubkey,
      });

      setNewAdminNpub("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setAddingAdmin(false);
    }
  };

  const onRemoveAdmin = async (pubkey: string) => {
    try {
      setRemovingAdminKey(pubkey);

      setError("");

      await performAction({ action: "remove-admin-pubkey", pubkey });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setRemovingAdminKey(null);
    }
  };

  const onAddEditor = async () => {
    if (!newEditorNpub.trim()) {
      return;
    }

    const result = validateNpub(newEditorNpub.trim());

    if (result.valid === false) {
      setError(result.error);

      return;
    }

    try {
      setAddingEditor(true);
      setError("");

      await performAction({
        action: "add-editor-pubkey",
        pubkey: result.pubkey,
      });

      setNewEditorNpub("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setAddingEditor(false);
    }
  };

  const onRemoveEditor = async (pubkey: string) => {
    try {
      setRemovingEditorKey(pubkey);
      setError("");

      await performAction({ action: "remove-editor-pubkey", pubkey });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bilinmeyen hata");
    } finally {
      setRemovingEditorKey(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {error && <div className="text-red-500">{error}</div>}

      {/* Admin Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Yöneticiler ({adminUsers.length || 0})
          </CardTitle>
          <CardDescription>Kullanıcı ekleyip çıkarabilir</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {adminUsers.map((pubkey) => (
              <div
                key={pubkey}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="font-mono text-sm">
                  {pubkey.substring(0, 6)}...
                  {pubkey.substring(pubkey.length - 6)}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={removingAdminKey === pubkey || adminUsers.length === 1}
                  onClick={() => onRemoveAdmin(pubkey)}
                >
                  {removingAdminKey === pubkey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label htmlFor="newAdminNpub">Yeni Yönetici Ekle (npub)</Label>
            <Input
              id="newAdminNpub"
              placeholder="npub1..."
              value={newAdminNpub}
              onChange={(e) => setNewAdminNpub(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!newAdminNpub.trim() || addingAdmin}
              onClick={onAddAdmin}
            >
              {addingAdmin ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Yönetici Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Editor Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Editörler ({editorUsers.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {editorUsers.map((pubkey) => (
              <div
                key={pubkey}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="font-mono text-sm">
                  {pubkey.substring(0, 6)}...
                  {pubkey.substring(pubkey.length - 6)}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={removingEditorKey === pubkey}
                  onClick={() => onRemoveEditor(pubkey)}
                >
                  {removingEditorKey === pubkey ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-4 border-t">
            <Label htmlFor="newEditorNpub">Yeni Editör Ekle (npub)</Label>
            <Input
              id="newEditorNpub"
              placeholder="npub1..."
              value={newEditorNpub}
              onChange={(e) => setNewEditorNpub(e.target.value)}
            />
            <Button
              className="w-full"
              variant="secondary"
              disabled={!newEditorNpub.trim() || addingEditor}
              onClick={onAddEditor}
            >
              {addingEditor ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Editör Ekle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
