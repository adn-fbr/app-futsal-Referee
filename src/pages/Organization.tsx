import { useState, useMemo } from "react";
import { Search, Phone, Mail, ChevronDown, ChevronRight, Building2, Users, MapPin, Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  usePengurusList, 
  useProvinsiList, 
  useKabupatenKotaList, 
  useCreatePengurus, 
  useUpdatePengurus, 
  useDeletePengurus,
  usePengurusAccess,
  Pengurus 
} from "@/hooks/useOrganization";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PengurusFormDialog } from "@/components/organization/PengurusFormDialog";
import { DeletePengurusDialog } from "@/components/organization/DeletePengurusDialog";
import { WasitSection } from "@/components/organization/WasitSection";

const organizationData = {
  name: "Asosiasi Futsal Provinsi Sulawesi Selatan",
  established: "2015",
  address: "Jl. Perintis Kemerdekaan KM 12, Makassar",
  phone: "(0411) 123-4567",
  email: "info@ffss.or.id",
};

export default function Organization() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepartments, setOpenDepartments] = useState<string[]>(["PROVINSI"]);
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [kabupatenFilter, setKabupatenFilter] = useState<string>("all");

  // CRUD state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedPengurus, setSelectedPengurus] = useState<Pengurus | null>(null);

  // Auth and access
  const { isAdminProvinsi, kabupatenKotaId } = useAuth();
  const pengurusAccess = usePengurusAccess();

  // Fetch data from database
  const { data: pengurusList, isLoading: isLoadingPengurus } = usePengurusList();
  const { data: provinsiList } = useProvinsiList();
  const { data: kabupatenKotaList } = useKabupatenKotaList();

  // Mutations
  const createPengurus = useCreatePengurus();
  const updatePengurus = useUpdatePengurus();
  const deletePengurus = useDeletePengurus();

  const toggleDepartment = (id: string) => {
    setOpenDepartments((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  // Check if user can manage a specific pengurus
  const canManagePengurus = (pengurus: Pengurus) => {
    if (isAdminProvinsi()) return true;
    if (pengurusAccess?.isAdminKabKota && pengurus.level === "KAB_KOTA") {
      return pengurus.kabupaten_kota_id === pengurusAccess.kabupatenKotaId;
    }
    return false;
  };

  // Check if user can add pengurus
  const canAddPengurus = () => {
    return isAdminProvinsi() || pengurusAccess?.isAdminKabKota;
  };

  // Handlers
  const handleAddClick = () => {
    setSelectedPengurus(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (pengurus: Pengurus) => {
    setSelectedPengurus(pengurus);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (pengurus: Pengurus) => {
    setSelectedPengurus(pengurus);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (data: {
    user_id: string;
    level: "PROVINSI" | "KAB_KOTA";
    jabatan: string;
    kabupaten_kota_id?: string;
  }) => {
    try {
      if (selectedPengurus) {
        // Update existing
        await updatePengurus.mutateAsync({
          id: selectedPengurus.id,
          jabatan: data.jabatan,
        });
        toast.success("Pengurus berhasil diperbarui");
      } else {
        // Create new
        await createPengurus.mutateAsync({
          user_id: data.user_id,
          level: data.level,
          jabatan: data.jabatan,
          kabupaten_kota_id: data.kabupaten_kota_id,
        });
        toast.success("Pengurus berhasil ditambahkan");
      }
      setIsFormOpen(false);
      setSelectedPengurus(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan pengurus");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPengurus) return;
    
    try {
      await deletePengurus.mutateAsync(selectedPengurus.id);
      toast.success("Pengurus berhasil dihapus");
      setIsDeleteOpen(false);
      setSelectedPengurus(null);
    } catch (error: any) {
      toast.error(error.message || "Gagal menghapus pengurus");
    }
  };

  // Group pengurus by level and region
  const groupedPengurus = useMemo(() => {
    if (!pengurusList) return [];

    // Filter based on search, level, and kabupaten
    let filtered = pengurusList.filter((p) => p.is_active);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.profile?.full_name?.toLowerCase().includes(query) ||
          p.jabatan.toLowerCase().includes(query)
      );
    }

    if (levelFilter !== "all") {
      filtered = filtered.filter((p) => p.level === levelFilter);
    }

    if (kabupatenFilter !== "all") {
      filtered = filtered.filter((p) => p.kabupaten_kota_id === kabupatenFilter);
    }

    // Group by level first
    const provinsiPengurus = filtered.filter((p) => p.level === "PROVINSI");
    const kabKotaPengurus = filtered.filter((p) => p.level === "KAB_KOTA");

    const groups: {
      id: string;
      name: string;
      level: "PROVINSI" | "KAB_KOTA";
      members: typeof filtered;
    }[] = [];

    // Add Provinsi group if has members or no filter
    if (provinsiPengurus.length > 0 || (levelFilter === "all" && searchQuery === "")) {
      groups.push({
        id: "PROVINSI",
        name: `Pengurus Provinsi ${provinsiList?.[0]?.name || ""}`.trim(),
        level: "PROVINSI",
        members: provinsiPengurus,
      });
    }

    // Group Kab/Kota pengurus by their kabupaten_kota
    const kabKotaGrouped = kabKotaPengurus.reduce((acc, p) => {
      const kabId = p.kabupaten_kota_id || "unknown";
      if (!acc[kabId]) {
        acc[kabId] = [];
      }
      acc[kabId].push(p);
      return acc;
    }, {} as Record<string, typeof kabKotaPengurus>);

    // Add each Kab/Kota group
    Object.entries(kabKotaGrouped).forEach(([kabId, members]) => {
      const kabName = kabupatenKotaList?.find((k) => k.id === kabId)?.name || "Unknown";
      groups.push({
        id: kabId,
        name: `Pengurus ${kabName}`,
        level: "KAB_KOTA",
        members,
      });
    });

    // If filter is "all" and no search, show empty kab/kota groups too
    if (levelFilter === "all" && searchQuery === "" && kabupatenFilter === "all") {
      kabupatenKotaList?.forEach((kab) => {
        if (!kabKotaGrouped[kab.id]) {
          groups.push({
            id: kab.id,
            name: `Pengurus ${kab.name}`,
            level: "KAB_KOTA",
            members: [],
          });
        }
      });
    }

    return groups;
  }, [pengurusList, provinsiList, kabupatenKotaList, searchQuery, levelFilter, kabupatenFilter]);

  const totalMembers = pengurusList?.filter((p) => p.is_active).length || 0;
  const totalProvinsi = pengurusList?.filter((p) => p.is_active && p.level === "PROVINSI").length || 0;
  const totalKabKota = pengurusList?.filter((p) => p.is_active && p.level === "KAB_KOTA").length || 0;

  // Check if group has Koordinator Wasit
  const hasKoordinatorWasit = (members: Pengurus[]) => {
    return members.some((m) => m.jabatan.toLowerCase().includes("koordinator wasit"));
  };

  return (
    <AppLayout title="Struktur Organisasi">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Organization Header */}
        <Card className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-foreground/20 rounded-xl">
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{organizationData.name}</h2>
                  <p className="text-sm text-primary-foreground/80">
                    Berdiri sejak {organizationData.established}
                  </p>
                </div>
              </div>
              {canAddPengurus() && (
                <Button 
                  onClick={handleAddClick}
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah
                </Button>
              )}
            </div>
            <div className="space-y-2 text-sm text-primary-foreground/90">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {organizationData.phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {organizationData.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{totalMembers}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{totalProvinsi}</p>
              <p className="text-xs text-muted-foreground">Provinsi</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-xl font-bold">{totalKabKota}</p>
              <p className="text-xs text-muted-foreground">Kab/Kota</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari pengurus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Level</SelectItem>
              <SelectItem value="PROVINSI">Provinsi</SelectItem>
              <SelectItem value="KAB_KOTA">Kab/Kota</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {levelFilter === "KAB_KOTA" && (
          <Select value={kabupatenFilter} onValueChange={setKabupatenFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Kabupaten/Kota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kabupaten/Kota</SelectItem>
              {kabupatenKotaList?.map((kab) => (
                <SelectItem key={kab.id} value={kab.id}>
                  {kab.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Loading State */}
        {isLoadingPengurus && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {/* Department List */}
        {!isLoadingPengurus && (
          <div className="space-y-3">
            {groupedPengurus.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Tidak ada data pengurus ditemukan</p>
                </CardContent>
              </Card>
            ) : (
              groupedPengurus.map((group) => (
                <Collapsible
                  key={group.id}
                  open={openDepartments.includes(group.id)}
                  onOpenChange={() => toggleDepartment(group.id)}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              {group.level === "PROVINSI" ? (
                                <Building2 className="h-4 w-4 text-primary" />
                              ) : (
                                <MapPin className="h-4 w-4 text-primary" />
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-sm flex items-center gap-2">
                                {group.name}
                                <Badge variant={group.level === "PROVINSI" ? "default" : "secondary"} className="text-[10px]">
                                  {group.level === "PROVINSI" ? "Provinsi" : "Kab/Kota"}
                                </Badge>
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {group.members.length} pengurus
                              </p>
                            </div>
                          </div>
                          {openDepartments.includes(group.id) ? (
                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4 px-4">
                        <div className="space-y-3 border-t border-border pt-3">
                          {group.members.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Belum ada pengurus terdaftar
                            </p>
                          ) : (
                            group.members.map((member) => (
                              <div key={member.id}>
                                <div
                                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                                >
                                  <Avatar>
                                    {member.profile?.profile_photo_url ? (
                                      <AvatarImage src={member.profile.profile_photo_url} alt={member.profile.full_name} />
                                    ) : null}
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                      {member.profile?.full_name
                                        ?.split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {member.profile?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {member.jabatan}
                                    </p>
                                  </div>
                                  {member.level === "KAB_KOTA" && member.kabupaten_kota && (
                                    <Badge variant="outline" className="text-[10px] hidden sm:flex">
                                      {member.kabupaten_kota.name}
                                    </Badge>
                                  )}
                                  {/* Action buttons */}
                                  {canManagePengurus(member) && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditClick(member);
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteClick(member);
                                        }}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Show Wasit Section under Koordinator Wasit */}
                                {member.jabatan.toLowerCase().includes("koordinator wasit") && 
                                  member.level === "KAB_KOTA" && 
                                  member.kabupaten_kota_id && (
                                  <WasitSection kabupatenKotaId={member.kabupaten_kota_id} />
                                )}
                              </div>
                            ))
                          )}
                          
                          {/* Show Wasit Section for KAB_KOTA groups without Koordinator Wasit */}
                          {group.level === "KAB_KOTA" && 
                            group.id !== "PROVINSI" && 
                            !hasKoordinatorWasit(group.members) && (
                            <WasitSection kabupatenKotaId={group.id} />
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PengurusFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        pengurus={selectedPengurus}
        onSubmit={handleFormSubmit}
        isLoading={createPengurus.isPending || updatePengurus.isPending}
      />

      <DeletePengurusDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        pengurus={selectedPengurus}
        onConfirm={handleDeleteConfirm}
        isLoading={deletePengurus.isPending}
      />
    </AppLayout>
  );
}
