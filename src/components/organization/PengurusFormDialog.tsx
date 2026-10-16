import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAvailableUsersForPengurus, useKabupatenKotaList, Pengurus } from "@/hooks/useOrganization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface PengurusFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pengurus?: Pengurus | null;
  onSubmit: (data: {
    user_id: string;
    level: "PROVINSI" | "KAB_KOTA";
    jabatan: string;
    kabupaten_kota_id?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const JABATAN_OPTIONS = [
  "Ketua",
  "Wakil Ketua",
  "Sekretaris",
  "Bendahara",
  "Koordinator Wasit",
  "Koordinator Pertandingan",
  "Anggota",
];

export function PengurusFormDialog({
  open,
  onOpenChange,
  pengurus,
  onSubmit,
  isLoading,
}: PengurusFormDialogProps) {
  const { isAdminProvinsi, kabupatenKotaId } = useAuth();
  const { data: users, isLoading: isLoadingUsers } = useAvailableUsersForPengurus();
  const { data: kabupatenList } = useKabupatenKotaList();

  const [userId, setUserId] = useState("");
  const [level, setLevel] = useState<"PROVINSI" | "KAB_KOTA">("KAB_KOTA");
  const [jabatan, setJabatan] = useState("");
  const [kabupatenKotaIdField, setKabupatenKotaIdField] = useState("");

  const isEdit = !!pengurus;
  const canSelectLevel = isAdminProvinsi();
  const canSelectKabupaten = isAdminProvinsi();

  useEffect(() => {
    if (pengurus) {
      setUserId(pengurus.user_id);
      setLevel(pengurus.level);
      setJabatan(pengurus.jabatan);
      setKabupatenKotaIdField(pengurus.kabupaten_kota_id || "");
    } else {
      setUserId("");
      setLevel(canSelectLevel ? "PROVINSI" : "KAB_KOTA");
      setJabatan("");
      setKabupatenKotaIdField(canSelectKabupaten ? "" : kabupatenKotaId || "");
    }
  }, [pengurus, open, canSelectLevel, canSelectKabupaten, kabupatenKotaId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await onSubmit({
      user_id: userId,
      level,
      jabatan,
      kabupaten_kota_id: level === "KAB_KOTA" ? kabupatenKotaIdField : undefined,
    });
  };

  const selectedUser = users?.find((u) => u.id === userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Pengurus" : "Tambah Pengurus"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ubah data pengurus yang sudah ada"
              : "Tambahkan pengurus baru ke struktur organisasi"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Selection - Only for new pengurus */}
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="user">Pilih User</Label>
              {isLoadingUsers ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat data user...
                </div>
              ) : (
                <Select value={userId} onValueChange={setUserId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih user">
                      {selectedUser && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={selectedUser.profile_photo_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {selectedUser.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{selectedUser.full_name}</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.profile_photo_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {user.full_name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.full_name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Level Selection - Only admin provinsi can select */}
          <div className="space-y-2">
            <Label htmlFor="level">Level</Label>
            <Select
              value={level}
              onValueChange={(v) => setLevel(v as "PROVINSI" | "KAB_KOTA")}
              disabled={!canSelectLevel}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {canSelectLevel && (
                  <SelectItem value="PROVINSI">Provinsi</SelectItem>
                )}
                <SelectItem value="KAB_KOTA">Kabupaten/Kota</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Kabupaten Selection - Only for KAB_KOTA level */}
          {level === "KAB_KOTA" && (
            <div className="space-y-2">
              <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
              <Select
                value={kabupatenKotaIdField}
                onValueChange={setKabupatenKotaIdField}
                disabled={!canSelectKabupaten}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kabupaten/Kota" />
                </SelectTrigger>
                <SelectContent>
                  {kabupatenList?.map((kab) => (
                    <SelectItem key={kab.id} value={kab.id}>
                      {kab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Jabatan */}
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Select value={jabatan} onValueChange={setJabatan} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Jabatan" />
              </SelectTrigger>
              <SelectContent>
                {JABATAN_OPTIONS.map((j) => (
                  <SelectItem key={j} value={j}>
                    {j}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Custom jabatan input */}
            <Input
              placeholder="Atau ketik jabatan lain..."
              value={JABATAN_OPTIONS.includes(jabatan) ? "" : jabatan}
              onChange={(e) => setJabatan(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading || !userId || !jabatan}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Simpan" : "Tambah"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
