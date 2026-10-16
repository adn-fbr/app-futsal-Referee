import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  User,
  Calendar,
  MapPin,
  Briefcase,
  Award,
  FileText,
  Edit3,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  CalendarDays,
  Wallet,
  Check,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile, uploadProfileImage } from "@/hooks/useProfile";
import { toast } from "sonner";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { useRefereeContact, useUpsertRefereeContact } from "@/hooks/useRefereeContact";
import { normalizeRefereeContactNumber } from "@/lib/refereeContact";

// AFK options
const afkOptions = [
  { value: "makassar", label: "AFK Kota Makassar" },
  { value: "gowa", label: "AFK Kabupaten Gowa" },
  { value: "maros", label: "AFK Kabupaten Maros" },
  { value: "takalar", label: "AFK Kabupaten Takalar" },
  { value: "bone", label: "AFK Kabupaten Bone" },
  { value: "bulukumba", label: "AFK Kabupaten Bulukumba" },
  { value: "sinjai", label: "AFK Kabupaten Sinjai" },
  { value: "wajo", label: "AFK Kabupaten Wajo" },
];

const licenseOptions = [
  { value: "level_3", label: "Level 3", description: "Lisensi Dasar" },
  { value: "level_2", label: "Level 2", description: "Lisensi Menengah" },
  { value: "level_1", label: "Level 1", description: "Lisensi Tertinggi" },
];

interface ProfileData {
  profilePhoto: string | null;
  profilePhotoFile: File | null;
  fullName: string;
  birthDate: Date | undefined;
  afk: string;
  occupation: string;
  licenseLevel: string;
  licensePhoto: string | null;
  licensePhotoFile: File | null;
  ktpPhoto: string | null;
  ktpPhotoFile: File | null;
}

export default function RefereeProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, role } = useAuth();
  const { data: profile, isLoading: profileLoading, isError: profileError, refetch: refetchProfile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: refereeContact } = useRefereeContact();
  const upsertRefereeContact = useUpsertRefereeContact();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDocumentDialog, setShowDocumentDialog] = useState<"license" | "ktp" | null>(null);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [isSavingWhatsapp, setIsSavingWhatsapp] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    profilePhoto: null,
    profilePhotoFile: null,
    fullName: "",
    birthDate: undefined,
    afk: "",
    occupation: "",
    licenseLevel: "",
    licensePhoto: null,
    licensePhotoFile: null,
    ktpPhoto: null,
    ktpPhotoFile: null,
  });

  const [editData, setEditData] = useState<ProfileData>(profileData);

  // Sync profile data from database
  useEffect(() => {
    if (profile) {
      const data: ProfileData = {
        profilePhoto: profile.profile_photo_url,
        profilePhotoFile: null,
        fullName: profile.full_name || "",
        birthDate: profile.birth_date ? new Date(profile.birth_date) : undefined,
        afk: profile.afk_origin || "",
        occupation: profile.occupation || "",
        licenseLevel: profile.license_level || "",
        licensePhoto: profile.license_photo_url,
        licensePhotoFile: null,
        ktpPhoto: profile.ktp_photo_url,
        ktpPhotoFile: null,
      };
      setProfileData(data);
      setEditData(data);
    }
  }, [profile]);

  useEffect(() => {
    if (refereeContact?.whatsapp_number) {
      setWhatsappInput(refereeContact.whatsapp_number);
    }
  }, [refereeContact]);

  const updateEditData = (field: keyof ProfileData, value: ProfileData[keyof ProfileData]) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (
    field: "profilePhoto" | "licensePhoto" | "ktpPhoto",
    fileField: "profilePhotoFile" | "licensePhotoFile" | "ktpPhotoFile",
    value: string | undefined,
    file?: File
  ) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value || null,
      [fileField]: file || null,
    }));
  };

  const getAfkLabel = (value: string) => {
    return afkOptions.find((opt) => opt.value === value)?.label || value;
  };

  const getLicenseLabel = (value: string) => {
    return licenseOptions.find((opt) => opt.value === value)?.label || value;
  };

  const handleStartEdit = () => {
    setEditData(profileData);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(profileData);
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      let profilePhotoUrl = editData.profilePhoto;
      let licensePhotoUrl = editData.licensePhoto;
      let ktpPhotoUrl = editData.ktpPhoto;

      // Upload new photos if files selected
      if (editData.profilePhotoFile) {
        profilePhotoUrl = await uploadProfileImage(
          user.id,
          editData.profilePhotoFile,
          "avatars",
          "profile"
        );
      }

      if (editData.licensePhotoFile) {
        licensePhotoUrl = await uploadProfileImage(
          user.id,
          editData.licensePhotoFile,
          "documents",
          "license"
        );
      }

      if (editData.ktpPhotoFile) {
        ktpPhotoUrl = await uploadProfileImage(
          user.id,
          editData.ktpPhotoFile,
          "documents",
          "ktp"
        );
      }

      await updateProfile.mutateAsync({
        full_name: editData.fullName,
        birth_date: editData.birthDate ? format(editData.birthDate, "yyyy-MM-dd") : null,
        afk_origin: editData.afk || null,
        occupation: editData.occupation || null,
        license_level: editData.licenseLevel || null,
        profile_photo_url: profilePhotoUrl,
        license_photo_url: licensePhotoUrl,
        ktp_photo_url: ktpPhotoUrl,
      });

      setIsEditing(false);
    } catch (error: unknown) {
      console.error("Profile update failed", error);
      toast.error("Profil gagal diperbarui. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    const normalized = normalizeRefereeContactNumber(whatsappInput);
    if (!normalized) {
      toast.error("Masukkan nomor WhatsApp yang valid.");
      return;
    }

    setIsSavingWhatsapp(true);
    try {
      await upsertRefereeContact.mutateAsync({ whatsapp_number: normalized });
      toast.success("Nomor WhatsApp berhasil diperbarui.");
    } catch (error) {
      console.error("Save referee WhatsApp contact failed", error);
      toast.error("Anda tidak memiliki izin untuk memperbarui data ini.");
    } finally {
      setIsSavingWhatsapp(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
    { icon: CalendarDays, label: "Event", path: "/referee/events" },
    { icon: Wallet, label: "Honor", path: "/referee/honor" },
    { icon: User, label: "Profil", path: "/referee/profile" },
  ];

  const roleLabels: Record<string, string> = {
    admin_provinsi: "Admin Provinsi",
    admin_kab_kota: "Admin Kabupaten/Kota",
    evaluator: "Evaluator",
    panitia: "Panitia",
    wasit: "Wasit",
  };
  const displayRole = role ? roleLabels[role] ?? role : "Pengguna AFP Sulsel";
  const initials = (profileData.fullName || user?.email || "AF")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-3xl space-y-4 px-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="rounded-full bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Profil tidak dapat dimuat</h1>
              <p className="mt-1 text-sm text-muted-foreground">Terjadi masalah saat mengambil data profil.</p>
            </div>
            <Button onClick={() => void refetchProfile()} className="min-h-11">
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-gradient-to-br from-primary via-primary to-accent px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">AFP Sulsel Referee</p>
              <h1 className="mt-1 text-xl font-bold text-primary-foreground">Profil Saya</h1>
            </div>
          {!isEditing ? (
            <Button
              variant="ghost"
              className="min-h-11 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleStartEdit}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Edit Profil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                onClick={handleCancelEdit}
              >
                <X className="mr-1 h-4 w-4" />
                Batal
              </Button>
              <Button
                className="min-h-11 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                onClick={handleSaveEdit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" />Menyimpan…</>
                ) : (
                  <><Check className="mr-1 h-4 w-4" />Simpan</>
                )}
              </Button>
            </div>
          )}
          </div>

          <div className="flex flex-col items-center text-center">
          {isEditing ? (
            <ImageUpload
              variant="avatar"
              value={editData.profilePhoto || undefined}
              onChange={(val, file) => handleImageChange("profilePhoto", "profilePhotoFile", val, file)}
            />
            ) : (
              <Avatar className="h-28 w-28 border-4 border-primary-foreground/30 shadow-xl">
                <AvatarImage src={profileData.profilePhoto || undefined} alt={`Foto ${profileData.fullName || "profil"}`} />
                <AvatarFallback className="bg-primary-foreground/20 text-2xl font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            )}

            {!isEditing && (
              <>
                <h2 className="mt-4 text-2xl font-bold text-primary-foreground">{profileData.fullName || "Nama belum diisi"}</h2>
                <p className="mt-1 text-sm text-primary-foreground/75">{displayRole}</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <StatusBadge status={profile?.is_profile_complete ? "success" : "warning"}>
                    {profile?.is_profile_complete ? "Profil lengkap" : "Profil perlu dilengkapi"}
                  </StatusBadge>
                  <Badge variant="secondary" className="bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/20">
                    {getLicenseLabel(profileData.licenseLevel) || "Lisensi belum diatur"}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="mx-auto -mt-12 max-w-5xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          {isEditing ? (
            <div className="space-y-6 p-5 sm:p-7">
              <div className="border-b pb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pengaturan profile</p>
                <h2 className="mt-1 text-xl font-semibold">Perbarui informasi Anda</h2>
                <p className="mt-1 text-sm text-muted-foreground">Simpan perubahan setelah semua data yang diperlukan sudah sesuai.</p>
              </div>

              <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email akun</p>
                  <p className="mt-1 truncate text-sm font-medium">{user?.email || "Email belum tersedia"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Dikelola oleh akun dan tidak dapat diubah di sini.</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</p>
                  <p className="mt-1 text-sm font-medium">{displayRole}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Role dikelola oleh administrator.</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold">Data pribadi</h3>
                <p className="mt-1 text-sm text-muted-foreground">Informasi dasar yang tampil di profil Anda.</p>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="profile-full-name" className="text-sm font-medium">Nama Lengkap</Label>
                <Input
                  id="profile-full-name"
                  value={editData.fullName}
                  onChange={(e) => updateEditData("fullName", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Lahir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-11 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.birthDate
                        ? format(editData.birthDate, "dd MMMM yyyy", { locale: id })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editData.birthDate}
                      onSelect={(date) => updateEditData("birthDate", date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* AFK */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-semibold">Wilayah dan pekerjaan</h3>
                <p className="mt-1 text-sm text-muted-foreground">Data organisasi yang melekat pada profil Anda.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-afk" className="text-sm font-medium">Asal AFK</Label>
                <Select
                  value={editData.afk}
                  onValueChange={(val) => updateEditData("afk", val)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {afkOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Occupation */}
              <div className="space-y-2">
                <Label htmlFor="profile-occupation" className="text-sm font-medium">Pekerjaan</Label>
                <Input
                  id="profile-occupation"
                  value={editData.occupation}
                  onChange={(e) => updateEditData("occupation", e.target.value)}
                  className="h-11"
                />
              </div>

              {/* License Level */}
              <div className="border-t pt-5">
                <h3 className="text-sm font-semibold">Lisensi dan dokumen</h3>
                <p className="mt-1 text-sm text-muted-foreground">Pilih level lisensi dan kelola dokumen yang sudah tersedia.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Level Lisensi</Label>
                <RadioGroup
                  value={editData.licenseLevel}
                  onValueChange={(val) => updateEditData("licenseLevel", val)}
                  className="space-y-2"
                >
                  {licenseOptions.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer",
                        editData.licenseLevel === option.value
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      )}
                      onClick={() => updateEditData("licenseLevel", option.value)}
                    >
                      <RadioGroupItem value={option.value} id={`edit-${option.value}`} />
                      <Label htmlFor={`edit-${option.value}`} className="text-sm cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* License Photo */}
              <ImageUpload
                label="Foto Lisensi"
                value={editData.licensePhoto || undefined}
                onChange={(val, file) => handleImageChange("licensePhoto", "licensePhotoFile", val, file)}
              />

              {/* KTP Photo */}
              <ImageUpload
                label="Foto KTP"
                value={editData.ktpPhoto || undefined}
                onChange={(val, file) => handleImageChange("ktpPhoto", "ktpPhotoFile", val, file)}
              />
            </div>
          ) : (
            <>
              {/* Info Section */}
              <div className="p-5 sm:p-7">
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Informasi profile</p>
                  <h2 className="mt-1 text-xl font-semibold">Data utama</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Tanggal Lahir</p>
                    <p className="text-sm font-medium">
                      {profileData.birthDate
                        ? format(profileData.birthDate, "dd MMMM yyyy", { locale: id })
                        : "-"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Asal AFK</p>
                    <p className="text-sm font-medium">{getAfkLabel(profileData.afk) || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Pekerjaan</p>
                    <p className="text-sm font-medium">{profileData.occupation || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Level Lisensi</p>
                    <p className="text-sm font-medium">
                      {getLicenseLabel(profileData.licenseLevel) || "-"}
                    </p>
                  </div>
                </div>
                </div>
              </div>

              {/* Documents Section */}
              <div className="border-t bg-muted/30 p-5 sm:p-7">
                <h3 className="text-lg font-semibold">Dokumen</h3>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">Akses dokumen profil dan kartu identitas yang tersimpan.</p>
                <div className="space-y-2">
                  <Link to="/referee/id-card">
                    <button className="w-full flex items-center gap-3 p-3 bg-background rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <Award className="w-5 h-5 text-primary" />
                      <span className="flex-1 text-left text-sm font-medium">ID Card Wasit</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </Link>
                  <button
                    className="w-full flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    onClick={() => setShowDocumentDialog("license")}
                    disabled={!profileData.licensePhoto}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-left text-sm">Foto Lisensi</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    className="w-full flex items-center gap-3 p-3 bg-background rounded-lg border border-border"
                    onClick={() => setShowDocumentDialog("ktp")}
                    disabled={!profileData.ktpPhoto}
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="flex-1 text-left text-sm">Foto KTP</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* WhatsApp Contact Section */}
              <div className="border-t border-border p-5 sm:p-7">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">Informasi kontak</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Email akun bersifat read-only. Nomor WhatsApp dikelola melalui mekanisme kontak yang tersedia.</p>
                </div>
                <div className="mb-5 rounded-lg border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email terdaftar</p>
                  {user?.email ? (
                    <a href={`mailto:${user.email}`} className="mt-1 block truncate text-sm font-medium text-primary underline-offset-4 hover:underline">{user.email}</a>
                  ) : (
                    <p className="mt-1 text-sm text-muted-foreground">Email belum tersedia.</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">Dikelola oleh akun dan tidak diubah dari halaman ini.</p>
                </div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-semibold">Nomor WhatsApp</h4>
                    <p className="text-xs text-muted-foreground">Digunakan untuk menerima notifikasi penugasan wasit melalui WhatsApp.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <Input
                    id="whatsapp-number"
                    value={whatsappInput}
                    onChange={(event) => setWhatsappInput(event.target.value)}
                    placeholder="6285812345678"
                    disabled={isSavingWhatsapp}
                  />
                  <Button
                    onClick={handleSaveWhatsApp}
                    disabled={isSavingWhatsapp}
                    className="w-full"
                  >
                    {isSavingWhatsapp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan"
                    )}
                  </Button>
                </div>
              </div>

              {/* Notification Preferences Section */}
              <div className="p-4">
                <NotificationPreferences />
              </div>

              {/* Logout Button */}
              <div className="p-4 pt-0">
                <Button
                  variant="outline"
                  className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog
        open={showDocumentDialog !== null}
        onOpenChange={() => setShowDocumentDialog(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {showDocumentDialog === "license" ? "Foto Lisensi" : "Foto KTP"}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-muted">
            <img
              src={
                showDocumentDialog === "license"
                  ? profileData.licensePhoto || ""
                  : profileData.ktpPhoto || ""
              }
              alt={showDocumentDialog === "license" ? "Lisensi" : "KTP"}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Konfirmasi Keluar</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Apakah Anda yakin ingin keluar dari akun ini?
          </p>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="flex-1"
            >
              Keluar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
