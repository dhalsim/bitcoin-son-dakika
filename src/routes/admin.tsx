import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Shield, Key, AlertCircle, Loader2, Users, UserPlus, Trash2, RefreshCw } from 'lucide-react';

interface AdminData {
  adminUsers: string[];
  editorUsers: string[];
  totalAdmins: number;
  totalEditors: number;
}

interface UserInfo {
  pubkey?: string;
  roles?: string[];
}

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo>({});
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string>('');

  // Form states
  const [newAdminPubkey, setNewAdminPubkey] = useState('');
  const [newEditorPubkey, setNewEditorPubkey] = useState('');

  useEffect(() => {
    loadAdminData();
    checkUserInfo();
  }, []);

  const loadAdminData = async () => {
    try {
      const response = await fetch('/functions/admin');
      if (response.ok) {
        const data = await response.json();
        setAdminData(data);
      } else {
        setError('Admin verileri yüklenemedi');
      }
    } catch (err) {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  const checkUserInfo = async () => {
    try {
      if (!window.nostr) return;
      
      const pubkey = await window.nostr.getPublicKey();
      setUserInfo({ pubkey });
    } catch (err) {
      console.log('Nostr extension not available or user declined');
    }
  };

  const createNIP98Auth = async (method: string, url: string) => {
    if (!window.nostr || !userInfo.pubkey) {
      throw new Error('Nostr uzantısı gerekli');
    }

    const authEvent = {
      kind: 27235,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['u', url],
        ['method', method]
      ],
      content: '',
      pubkey: userInfo.pubkey
    };

    const signedEvent = await window.nostr.signEvent(authEvent);
    return `Nostr ${btoa(JSON.stringify(signedEvent))}`;
  };

  const performAction = async (action: string, data: { pubkey: string }) => {
    setActionLoading(action);
    setError('');

    try {
      const authHeader = await createNIP98Auth('POST', `${window.location.origin}/functions/admin`);
      
      const response = await fetch('/functions/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({ action, ...data })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadAdminData(); // Refresh data
        // Clear form inputs
        if (action.includes('add-admin')) setNewAdminPubkey('');
        if (action.includes('add-editor')) setNewEditorPubkey('');
      } else {
        setError(result.error || 'İşlem başarısız');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
    } finally {
      setActionLoading('');
    }
  };

  const addAdmin = () => {
    if (!newAdminPubkey.trim()) return;
    performAction('add-admin-pubkey', { pubkey: newAdminPubkey.trim() });
  };

  const removeAdmin = (pubkey: string) => {
    performAction('remove-admin-pubkey', { pubkey });
  };

  const addEditor = () => {
    if (!newEditorPubkey.trim()) return;
    performAction('add-editor-pubkey', { pubkey: newEditorPubkey.trim() });
  };

  const removeEditor = (pubkey: string) => {
    performAction('remove-editor-pubkey', { pubkey });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Yükleniyor...</span>
        </div>
      </div>
    );
  }

  const userIsAdmin = userInfo.pubkey && adminData?.adminUsers.includes(userInfo.pubkey);
  const userIsEditor = userInfo.pubkey && adminData?.editorUsers.includes(userInfo.pubkey);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Yönetim Paneli</h1>
          <p className="text-gray-600 dark:text-gray-400">Bitcoin Son Dakika - İçerik Yönetimi</p>
          
          {userInfo.pubkey ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                <Key className="h-3 w-3 mr-1" />
                {userInfo.pubkey.substring(0, 16)}...
              </Badge>
              {userIsAdmin && <Badge variant="default">Admin</Badge>}
              {userIsEditor && <Badge variant="secondary">Editör</Badge>}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                İşlem yapmak için Nostr uzantısı gerekli. Veriler görüntüleme genel erişime açıktır.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Admin Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{adminData?.totalAdmins || 0}</p>
                  <p className="text-gray-600 dark:text-gray-400">Yöneticiler</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{adminData?.totalEditors || 0}</p>
                  <p className="text-gray-600 dark:text-gray-400">Editörler</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Management - Only show if user is admin */}
        {userIsAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Admin Users Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Yöneticiler ({adminData?.adminUsers.length || 0})
                </CardTitle>
                <CardDescription>
                  Kullanıcı ekleyip çıkarabilir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {adminData?.adminUsers.map((pubkey) => (
                    <div key={pubkey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-mono text-sm">
                        {pubkey.substring(0, 16)}...
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading === 'remove-admin-pubkey' || adminData.adminUsers.length === 1}
                        onClick={() => removeAdmin(pubkey)}
                      >
                        {actionLoading === 'remove-admin-pubkey' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <Label htmlFor="newAdminPubkey">Yeni Yönetici Ekle</Label>
                  <Input
                    id="newAdminPubkey"
                    placeholder="Pubkey'i girin"
                    value={newAdminPubkey}
                    onChange={(e) => setNewAdminPubkey(e.target.value)}
                  />
                  <Button 
                    className="w-full"
                    disabled={!newAdminPubkey.trim() || actionLoading === 'add-admin-pubkey'}
                    onClick={addAdmin}
                  >
                    {actionLoading === 'add-admin-pubkey' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Yönetici Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Editor Users Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Editörler ({adminData?.editorUsers.length || 0})
                </CardTitle>
                <CardDescription>
                  İçerik yayınlayabilir ve deploy tetikleyebilir
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {adminData?.editorUsers.map((pubkey) => (
                    <div key={pubkey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-mono text-sm">
                        {pubkey.substring(0, 16)}...
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading === 'remove-editor-pubkey'}
                        onClick={() => removeEditor(pubkey)}
                      >
                        {actionLoading === 'remove-editor-pubkey' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 pt-4 border-t">
                  <Label htmlFor="newEditorPubkey">Yeni Editör Ekle</Label>
                  <Input
                    id="newEditorPubkey"
                    placeholder="Pubkey'i girin"
                    value={newEditorPubkey}
                    onChange={(e) => setNewEditorPubkey(e.target.value)}
                  />
                  <Button 
                    className="w-full"
                    variant="secondary"
                    disabled={!newEditorPubkey.trim() || actionLoading === 'add-editor-pubkey'}
                    onClick={addEditor}
                  >
                    {actionLoading === 'add-editor-pubkey' ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Editör Ekle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Non-Admin Users - Show read-only view */}
        {!userIsAdmin && adminData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Yöneticiler ({adminData.adminUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {adminData.adminUsers.map((pubkey) => (
                    <div key={pubkey} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-mono text-sm">
                        {pubkey.substring(0, 16)}...
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Editörler ({adminData.editorUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {adminData.editorUsers.map((pubkey) => (
                    <div key={pubkey} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="font-mono text-sm">
                        {pubkey.substring(0, 16)}...
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No permissions message */}
        {userInfo.pubkey && !userIsAdmin && !userIsEditor && (
          <Alert>
            <AlertDescription>
              Bu hesap için henüz yetki tanımlanmamış. Yöneticiden yetki talep edin.
            </AlertDescription>
          </Alert>
        )}

      </div>
    </div>
  );
} 