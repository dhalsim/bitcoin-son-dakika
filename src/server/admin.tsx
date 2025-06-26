import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users,
  Settings,
  Shield,
  UserPlus,
  Trash2,
  RefreshCw,
  Key
} from 'lucide-react';

interface UserData {
  pubkey: string;
  roles: ('admin' | 'editor')[];
  adminUsers: string[];
  editorUsers: string[];
}

interface AdminProps {
  userData: UserData;
}

export function AdminPanel({ userData }: AdminProps) {
  const userIsAdmin = userData.roles.includes('admin');
  const userIsEditor = userData.roles.includes('editor');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Yönetim Paneli</h1>
          <p className="text-gray-600 dark:text-gray-400">Bitcoin Son Dakika - İçerik Yönetimi</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              <Key className="h-3 w-3 mr-1" />
              {userData.pubkey.substring(0, 16)}...
            </Badge>
            {userIsAdmin && <Badge variant="default">Admin</Badge>}
            {userIsEditor && <Badge variant="secondary">Editör</Badge>}
          </div>
        </div>

        {/* Admin-only Panels */}
        {userIsAdmin && (
          <>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Yönetici yetkileri ile kullanıcı ekleyip çıkarabilir, tüm işlemleri gerçekleştirebilirsiniz.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Admin Users Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Yöneticiler ({userData.adminUsers.length})
                  </CardTitle>
                  <CardDescription>
                    Kullanıcı ekleyip çıkarabilir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {userData.adminUsers.map((pubkey) => (
                      <div key={pubkey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-mono text-sm">
                          {pubkey.substring(0, 16)}...
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          data-action="removeUser"
                          data-pubkey={pubkey}
                          data-role="admin"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="newAdminPubkey">Yeni Yönetici Ekle</Label>
                    <Input
                      id="newAdminPubkey"
                      placeholder="Pubkey'i girin"
                    />
                    <Button 
                      className="w-full"
                      data-action="addUser"
                      data-role="admin"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
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
                    Editörler ({userData.editorUsers.length})
                  </CardTitle>
                  <CardDescription>
                    İçerik yayınlayabilir ve deploy tetikleyebilir
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {userData.editorUsers.map((pubkey) => (
                      <div key={pubkey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-mono text-sm">
                          {pubkey.substring(0, 16)}...
                        </span>
                        <Button
                          variant="destructive"
                          size="sm"
                          data-action="removeUser"
                          data-pubkey={pubkey}
                          data-role="editor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <Label htmlFor="newEditorPubkey">Yeni Editör Ekle</Label>
                    <Input
                      id="newEditorPubkey"
                      placeholder="Pubkey'i girin"
                    />
                    <Button 
                      className="w-full"
                      variant="secondary"
                      data-action="addUser"
                      data-role="editor"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Editör Ekle
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Editor-only or Admin Panels */}
        {(userIsEditor || userIsAdmin) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Site İşlemleri
              </CardTitle>
              <CardDescription>
                Site güncellemesi ve deploy işlemleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  variant="default"
                  className="w-full sm:w-auto"
                  data-action="triggerDeploy"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Site Güncellemesini Tetikle
                </Button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Bu işlem sitenin yeniden dağıtılmasını tetikler. Değişiklikler birkaç dakika içinde yayına alınır.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No permissions */}
        {!userIsAdmin && !userIsEditor && (
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

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-foreground">
            Yönetim Paneli
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bitcoin Son Dakika - Giriş yapın
          </p>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p>Bu sayfaya erişmek için Nostr kimlik doğrulaması gereklidir.</p>
              <p className="text-sm mt-2">Yalnızca yetkili hesaplar erişebilir.</p>
            </div>
            
            <Button className="w-full" data-action="login">
              Nostr ile Giriş Yap
            </Button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>Nostr uzantısı gereklidir (nos2x, Alby, window.nostr.js etc.)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Client-side JavaScript that will be injected
export const clientScript = `
let loading = false;

async function makeAuthenticatedRequest(url, options = {}) {
  if (!window.nostr) {
    throw new Error('Nostr uzantısı bulunamadı');
  }

  const authEvent = {
    kind: 27235,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['u', url],
      ['method', options.method || 'GET']
    ],
    content: ''
  };

  const signedEvent = await window.nostr.signEvent(authEvent);
  const authHeader = 'Nostr ' + btoa(JSON.stringify(signedEvent));

  return fetch(url, {
    ...options,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}

async function addUser(role) {
  const inputId = role === 'admin' ? 'newAdminPubkey' : 'newEditorPubkey';
  const pubkey = document.getElementById(inputId).value.trim();
  
  if (!pubkey) {
    alert('Lütfen pubkey girin.');
    return;
  }

  if (loading) return;
  loading = true;

  try {
    const response = await makeAuthenticatedRequest('/functions/manage-pubkeys', {
      method: 'POST',
      body: JSON.stringify({
        action: 'add',
        pubkey: pubkey,
        role: role
      })
    });

    if (response.ok) {
      alert(\`\${role === 'admin' ? 'Yönetici' : 'Editör'} başarıyla eklendi.\`);
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Hata: ' + (error.message || 'Kullanıcı eklenirken hata oluştu'));
    }
  } catch (error) {
    alert('Hata: ' + error.message);
  } finally {
    loading = false;
  }
}

async function removeUser(pubkey, role) {
  if (!confirm(\`Bu \${role === 'admin' ? 'yöneticiyi' : 'editörü'} kaldırmak istediğinizden emin misiniz?\`)) {
    return;
  }

  if (loading) return;
  loading = true;

  try {
    const response = await makeAuthenticatedRequest('/functions/manage-pubkeys', {
      method: 'POST',
      body: JSON.stringify({
        action: 'remove',
        pubkey: pubkey,
        role: role
      })
    });

    if (response.ok) {
      alert(\`\${role === 'admin' ? 'Yönetici' : 'Editör'} başarıyla kaldırıldı.\`);
      window.location.reload();
    } else {
      const error = await response.json();
      alert('Hata: ' + (error.message || 'Kullanıcı kaldırılırken hata oluştu'));
    }
  } catch (error) {
    alert('Hata: ' + error.message);
  } finally {
    loading = false;
  }
}

async function triggerDeploy() {
  if (!confirm('Site güncellemesini tetiklemek istediğinizden emin misiniz?')) {
    return;
  }

  if (loading) return;
  loading = true;

  try {
    const response = await makeAuthenticatedRequest('/functions/deploy-trigger', {
      method: 'POST'
    });

    if (response.ok) {
      alert('Site güncellemesi başarıyla tetiklendi.');
    } else {
      const error = await response.json();
      alert('Hata: ' + (error.message || 'Güncelleme tetiklenirken hata oluştu'));
    }
  } catch (error) {
    alert('Hata: ' + error.message);
  } finally {
    loading = false;
  }
}

async function authenticateWithNostr() {
  try {
    if (!window.nostr) {
      alert('Nostr uzantısı bulunamadı. Lütfen nos2x, Alby veya başka bir Nostr uzantısı yükleyin.');
      return;
    }

    const authEvent = {
      kind: 27235,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['u', window.location.href],
        ['method', 'GET']
      ],
      content: ''
    };

    const signedEvent = await window.nostr.signEvent(authEvent);
    const authHeader = 'Nostr ' + btoa(JSON.stringify(signedEvent));

    const response = await fetch(window.location.href, {
      headers: {
        'Authorization': authHeader
      }
    });

    if (response.ok) {
      window.location.reload();
    } else {
      alert('Giriş başarısız. Yetkiniz olmayabilir.');
    }
  } catch (error) {
    alert('Giriş sırasında hata: ' + error.message);
  }
}

// Event delegation for button clicks
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target || loading) return;

  const action = target.dataset.action;
  const role = target.dataset.role;
  const pubkey = target.dataset.pubkey;

  switch (action) {
    case 'addUser':
      addUser(role);
      break;
    case 'removeUser':
      removeUser(pubkey, role);
      break;
    case 'triggerDeploy':
      triggerDeploy();
      break;
    case 'login':
      authenticateWithNostr();
      break;
  }
});
`; 