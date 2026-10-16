import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { X } from "lucide-react";

export interface EventFilters {
  kabupatenKotaId: string | null;
  category: string | null;
}

interface EventFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: EventFilters;
  onApplyFilters: (filters: EventFilters) => void;
}

const EVENT_CATEGORIES = [
  { value: "liga", label: "Liga" },
  { value: "turnamen", label: "Turnamen" },
  { value: "pelajar", label: "Pelajar" },
  { value: "sekolah", label: "Sekolah" },
  { value: "mahasiswa", label: "Mahasiswa" },
  { value: "instansi", label: "Instansi" },
  { value: "umum", label: "Umum" },
  { value: "lain", label: "Lainnya" },
];

export function EventFilterSheet({ open, onOpenChange, filters, onApplyFilters }: EventFilterSheetProps) {
  const { data: kabupatenKotaList } = useKabupatenKotaList();
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters);

  useEffect(() => {
    if (open) {
      setLocalFilters(filters);
    }
  }, [open, filters]);

  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const handleReset = () => {
    const resetFilters: EventFilters = { kabupatenKotaId: null, category: null };
    setLocalFilters(resetFilters);
  };

  const activeFilterCount = [localFilters.kabupatenKotaId, localFilters.category].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-xl">
        <SheetHeader className="text-left">
          <SheetTitle>Filter Event</SheetTitle>
          <SheetDescription>
            Pilih kriteria untuk menyaring daftar event
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-6 space-y-5">
          {/* Kabupaten/Kota Filter */}
          <div className="space-y-2">
            <Label>Kabupaten/Kota</Label>
            <Select
              value={localFilters.kabupatenKotaId || "all"}
              onValueChange={(v) => setLocalFilters(prev => ({ ...prev, kabupatenKotaId: v === "all" ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua wilayah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua wilayah</SelectItem>
                {kabupatenKotaList?.map((kk) => (
                  <SelectItem key={kk.id} value={kk.id}>{kk.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label>Kategori</Label>
            <Select
              value={localFilters.category || "all"}
              onValueChange={(v) => setLocalFilters(prev => ({ ...prev, category: v === "all" ? null : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kategori</SelectItem>
                {EVENT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-between">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={activeFilterCount === 0}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleApply} className="flex-1 sm:flex-initial">
            Terapkan Filter
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
