import { useState, useEffect } from "react";

import { useUserContext } from "@/contexts/UserContext";
import { useNostrAuth } from "@/contexts/NostrAuthContext";
import { saveProfile, type ProfileUpdate } from "@/lib/nip01";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { NIP05Badge } from "@/components/NIP05Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { PROFILE_RELAYS } from "../../api-helpers/utils";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { userProfile, refreshProfile, userRelays } = useUserContext();
  const { signEvent } = useNostrAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdate>({
    name: "",
    display_name: "",
    picture: "",
    about: "",
    website: "",
    nip05: "",
    lud06: "",
    lud16: "",
  });

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile.profile) {
      setFormData({
        name: userProfile.profile.name || "",
        display_name: userProfile.profile.display_name || "",
        picture: userProfile.profile.picture || "",
        about: userProfile.profile.about || "",
        website: userProfile.profile.website || "",
        nip05: userProfile.profile.nip05 || "",
        lud06: userProfile.profile.lud06 || "",
        lud16: userProfile.profile.lud16 || "",
      });
    }
  }, [userProfile.profile]);

  const handleInputChange = (field: keyof ProfileUpdate, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!userProfile.pubkey) {
      toast({
        title: "Hata",
        description: "Kullanıcı kimliği bulunamadı",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const relays = [...new Set([...PROFILE_RELAYS, ...userRelays.writeRelays])];

      const success = await saveProfile(userProfile.pubkey, formData, signEvent, relays);

      if (success) {
        toast({
          title: "Başarılı",
          description: "Profil başarıyla güncellendi",
        });

        setIsEditing(false);

        refreshProfile(); // Refresh the profile data
      } else {
        toast({
          title: "Hata",
          description: "Profil güncellenirken bir hata oluştu",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving profile:", error);

      toast({
        title: "Hata",
        description:
          error instanceof Error ? error.message : "Profil güncellenirken bir hata oluştu",
        variant: "destructive",
      });
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    // Reset form data to current profile values
    if (userProfile.profile) {
      setFormData({
        name: userProfile.profile.name || "",
        display_name: userProfile.profile.display_name || "",
        picture: userProfile.profile.picture || "",
        about: userProfile.profile.about || "",
        website: userProfile.profile.website || "",
        nip05: userProfile.profile.nip05 || "",
        lud06: userProfile.profile.lud06 || "",
        lud16: userProfile.profile.lud16 || "",
      });
    }
    setIsEditing(false);
  };

  const handleClose = () => {
    // Reset editing state when closing
    setIsEditing(false);
    onOpenChange(false);
  };

  if (userProfile.isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profil</DialogTitle>
            <DialogDescription>Profil bilgilerinizi görüntüleyin ve düzenleyin</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Profil yükleniyor...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (userProfile.error || !userProfile.pubkey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Profil</DialogTitle>
            <DialogDescription>Profil bilgilerinizi görüntüleyin ve düzenleyin</DialogDescription>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {userProfile.error || "Profil bilgileri yüklenemedi"}
            </p>
            <Button onClick={refreshProfile}>Tekrar Dene</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Profil</DialogTitle>
              <DialogDescription>Profil bilgilerinizi görüntüleyin ve düzenleyin</DialogDescription>
            </div>
            {!isEditing && <Button onClick={() => setIsEditing(true)}>Düzenle</Button>}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              <ProfileAvatar
                pubkey={userProfile.pubkey}
                profile={userProfile.profile}
                size="lg"
                className="rounded-lg"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">İsim</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="İsminizi girin"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {userProfile.profile?.name || "Belirtilmemiş"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name">Görünen İsim</Label>
                  {isEditing ? (
                    <Input
                      id="display_name"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange("display_name", e.target.value)}
                      placeholder="Görünen isminizi girin"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {userProfile.profile?.display_name || "Belirtilmemiş"}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="picture">Profil Resmi URL</Label>
                {isEditing ? (
                  <Input
                    id="picture"
                    value={formData.picture}
                    onChange={(e) => handleInputChange("picture", e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {userProfile.profile?.picture || "Belirtilmemiş"}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* About Section */}
          <div className="space-y-2">
            <Label htmlFor="about">Hakkında</Label>
            {isEditing ? (
              <Textarea
                id="about"
                value={formData.about}
                onChange={(e) => handleInputChange("about", e.target.value)}
                placeholder="Kendiniz hakkında kısa bir açıklama yazın"
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {userProfile.profile?.about || "Belirtilmemiş"}
              </p>
            )}
          </div>

          <Separator />

          {/* Contact and Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">İletişim & Bağlantılar</h3>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Website
                </Label>
                {isEditing ? (
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://example.com"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <a
                      href={userProfile.profile?.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {userProfile.profile?.website || "Belirtilmemiş"}
                    </a>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nip05">NIP-05 Eşleşmesi</Label>
                {isEditing ? (
                  <Input
                    id="nip05"
                    value={formData.nip05}
                    onChange={(e) => handleInputChange("nip05", e.target.value)}
                    placeholder="user@domain.com"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    <NIP05Badge nip05={formData.nip05} pubkey={userProfile.pubkey} size="sm" />
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lightning</h3>

              <div className="space-y-2">
                <Label htmlFor="lud16">⚡️ Lightning Addresi</Label>
                {isEditing ? (
                  <Input
                    id="lud16"
                    value={formData.lud16}
                    onChange={(e) => handleInputChange("lud16", e.target.value)}
                    placeholder="user@domain.com"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {userProfile.profile?.lud16 || "Belirtilmemiş"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-3 pt-6">
              <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                İptal
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
