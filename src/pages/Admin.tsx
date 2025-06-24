import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Settings,
  Users,
  Save,
  Plus,
  Trash2,
  Edit
} from 'lucide-react';

const Admin = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Yönetim Paneli
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Bitcoin Son Dakika - İçerik Yönetimi
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Accordion type="single" collapsible className="space-y-4">
          {/* Bitcoin Son Dakika Haber Gir */}
          <AccordionItem value="haber-gir">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-main-accent" />
                <span className="text-lg font-semibold">Bitcoin Son Dakika Haber Gir</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="news-title">Haber Başlığı</Label>
                        <Input 
                          id="news-title" 
                          placeholder="Bitcoin ile ilgili haber başlığı..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="news-category">Kategori</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bitcoin">Bitcoin</SelectItem>
                            <SelectItem value="lightning">Lightning</SelectItem>
                            <SelectItem value="duzenleme">Düzenleme</SelectItem>
                            <SelectItem value="madencilik">Madencilik</SelectItem>
                            <SelectItem value="sirket">Şirket</SelectItem>
                            <SelectItem value="ulke">Ülke</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="news-summary">Özet</Label>
                      <Textarea 
                        id="news-summary" 
                        placeholder="Haberin kısa özeti..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="news-content">Haber İçeriği</Label>
                      <Textarea 
                        id="news-content" 
                        placeholder="Detaylı haber içeriği..."
                        rows={8}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="news-image">Görsel URL</Label>
                        <Input 
                          id="news-image" 
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="news-status">Durum</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Taslak</SelectItem>
                            <SelectItem value="published">Yayında</SelectItem>
                            <SelectItem value="scheduled">Zamanlanmış</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline">Taslak Olarak Kaydet</Button>
                      <Button className="bg-main-accent hover:bg-main-accent/90">
                        <Save className="w-4 h-4 mr-2" />
                        Yayınla
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Relay Yönetimi */}
          <AccordionItem value="relay-yonetimi">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-main-accent" />
                <span className="text-lg font-semibold">Relay Yönetimi</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Aktif Relay'ler</h3>
                      <Button size="sm" className="bg-main-accent hover:bg-main-accent/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Relay Ekle
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Sample relay entries */}
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">wss://relay.damus.io</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Aktif
                            </Badge>
                            <span>Son bağlantı: 2 dakika önce</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">wss://nos.lol</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              Bağlantı Kesildi
                            </Badge>
                            <span>Son bağlantı: 1 saat önce</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="relay-url">Yeni Relay URL</Label>
                        <Input 
                          id="relay-url" 
                          placeholder="wss://relay.example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="relay-name">Relay Adı</Label>
                        <Input 
                          id="relay-name" 
                          placeholder="Relay açıklaması..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button className="bg-main-accent hover:bg-main-accent/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Relay Ekle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {/* Editörler */}
          <AccordionItem value="editorler">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-main-accent" />
                <span className="text-lg font-semibold">Editörler</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Editör Listesi</h3>
                      <Button size="sm" className="bg-main-accent hover:bg-main-accent/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Editör Ekle
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {/* Sample editor entries */}
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">Ahmet Yılmaz</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Badge variant="secondary">Baş Editör</Badge>
                            <span>ahmet@example.com</span>
                            <span>•</span>
                            <span>Son giriş: Bugün 14:30</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">Fatma Demir</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                            <Badge variant="outline">İçerik Editörü</Badge>
                            <span>fatma@example.com</span>
                            <span>•</span>
                            <span>Son giriş: Dün 09:15</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="editor-name">Ad Soyad</Label>
                        <Input 
                          id="editor-name" 
                          placeholder="Editör adı soyadı"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editor-email">E-posta</Label>
                        <Input 
                          id="editor-email" 
                          type="email"
                          placeholder="editor@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editor-role">Rol</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Rol seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Baş Editör</SelectItem>
                            <SelectItem value="editor">İçerik Editörü</SelectItem>
                            <SelectItem value="writer">Yazar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button className="bg-main-accent hover:bg-main-accent/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Editör Ekle
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default Admin; 