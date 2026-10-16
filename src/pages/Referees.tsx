import { useState, useEffect } from "react";
import { Search, Filter, ChevronRight, X, MapPin, Download, RefreshCw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReferees, useRefereesCount, useRefereeStats, LICENSE_LEVELS, getLicenseBadgeColor, exportRefereesToCSV } from "@/hooks/useReferees";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { formatLicenseLevel } from "@/lib/formatters";
import { toast } from "sonner";

export default function Referees() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    kabKota: "",
    license: "",
    status: "",
     expiringLicense: "",
  });
  const [tempFilters, setTempFilters] = useState(filters);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters.kabKota, filters.license, filters.status]);

  // Build query filters
  const queryFilters = {
    search: searchQuery || undefined,
    kabupatenKotaId: filters.kabKota || undefined,
    licenseLevel: filters.license || undefined,
    isActive: filters.status === "active" ? true : filters.status === "inactive" ? false : undefined,
     expiringInDays: filters.expiringLicense ? 30 : undefined,
    page: currentPage,
    pageSize,
  };

  const { data: referees, isLoading, isError, refetch } = useReferees(queryFilters);
  const { data: totalCount, isLoading: isCountLoading, isError: isCountError, refetch: refetchCount } = useRefereesCount({
    search: searchQuery || undefined,
    kabupatenKotaId: filters.kabKota || undefined,
    licenseLevel: filters.license || undefined,
    isActive: filters.status === "active" ? true : filters.status === "inactive" ? false : undefined,
     expiringInDays: filters.expiringLicense ? 30 : undefined,
  });
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError, refetch: refetchStats } = useRefereeStats();
  const { data: kabupatenKotaList } = useKabupatenKotaList();

  const totalPages = Math.ceil((totalCount || 0) / pageSize);
  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length;

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
     const resetFilters = { kabKota: "", license: "", status: "", expiringLicense: "" };
    setTempFilters(resetFilters);
    setFilters(resetFilters);
  };

  const removeFilter = (key: keyof typeof filters) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
    setTempFilters((prev) => ({ ...prev, [key]: "" }));
  };

  const handleExportCSV = () => {
    if (!referees || referees.length === 0) {
      toast.error("Tidak ada data pada halaman ini untuk diekspor");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    let filename = `referees-export-${timestamp}`;
    
    if (filters.license) {
      filename += `-${filters.license}`;
    }
    if (filters.kabKota) {
      const kabName = kabupatenKotaList?.find(k => k.id === filters.kabKota)?.name;
      if (kabName) {
        filename += `-${kabName.replace(/\s+/g, "-").toLowerCase()}`;
      }
    }
    filename += ".csv";

    exportRefereesToCSV(referees, filename);
    toast.success(`${referees.length} wasit berhasil diekspor dari halaman ini`);
  };

  const retrySummary = () => {
    void refetchStats();
    void refetchCount();
  };

  const retryList = () => {
    void refetch();
    void refetchCount();
  };

  const hasQuery = searchQuery.trim().length > 0;
  const hasResults = Boolean(referees && referees.length > 0);
  const isEmptyResult = !isLoading && !isError && !hasResults;
  const resultStart = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const resultEnd = totalCount ? Math.min(currentPage * pageSize, totalCount) : 0;

  return (
    <AppLayout title="Wasit">
      <div className="p-4 sm:p-6 space-y-6 animate-fade-in">
        <header className="space-y-1">
          <p className="text-sm font-medium text-primary">AFP Sulsel</p>
          <h1 className="text-2xl font-bold tracking-tight">Wasit</h1>
          <p className="text-sm text-muted-foreground">Kelola data dan status wasit AFP Sulsel.</p>
        </header>

        {/* Operational summary */}
        <section aria-labelledby="referee-summary-heading" className="space-y-3">
          <h2 id="referee-summary-heading" className="sr-only">Ringkasan wasit</h2>
          {isStatsError ? (
            <Card>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <p className="text-sm text-muted-foreground">Data ringkasan tidak dapat dimuat.</p>
                <Button variant="outline" size="sm" onClick={retrySummary}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Coba lagi
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {[
                { label: "Total", value: stats?.total, tone: "text-primary" },
                { label: "Aktif", value: stats?.active, tone: "text-success" },
                { label: "Nonaktif", value: stats?.inactive, tone: "text-muted-foreground" },
              ].map((metric) => (
                <Card key={metric.label}>
                  <CardContent className="p-4">
                    {isStatsLoading ? (
                      <Skeleton className="mb-2 h-8 w-16" />
                    ) : (
                      <p className={`text-2xl font-bold ${metric.tone}`}>{metric.value}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Search and filter */}
        <section aria-labelledby="referee-controls-heading" className="space-y-3">
          <h2 id="referee-controls-heading" className="sr-only">Cari dan filter wasit</h2>
          <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Label htmlFor="referee-search" className="sr-only">Cari wasit</Label>
            <Input
              id="referee-search"
              aria-label="Cari wasit"
              placeholder="Cari nama, lisensi, atau asal AFK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {hasQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Hapus pencarian"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            disabled={!referees || referees.length === 0}
            aria-label="Export halaman ini"
            className="shrink-0"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export halaman ini</span>
          </Button>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative shrink-0" aria-label={`Filter${activeFilterCount ? `, ${activeFilterCount} aktif` : ""}`}>
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[80vh] pb-safe">
              <SheetHeader>
                <SheetTitle>Filter Wasit</SheetTitle>
                <SheetDescription>Pilih kriteria untuk memfilter daftar wasit</SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-4">
                <div className="space-y-2">
                  <Label>Kab/Kota</Label>
                  <Select
                    value={tempFilters.kabKota}
                    onValueChange={(value) => setTempFilters((prev) => ({ ...prev, kabKota: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Kab/Kota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kab/Kota</SelectItem>
                      {kabupatenKotaList?.map((kk) => (
                        <SelectItem key={kk.id} value={kk.id}>{kk.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Lisensi</Label>
                  <Select
                    value={tempFilters.license}
                    onValueChange={(value) => setTempFilters((prev) => ({ ...prev, license: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Lisensi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Lisensi</SelectItem>
                      {LICENSE_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={tempFilters.status}
                    onValueChange={(value) => setTempFilters((prev) => ({ ...prev, status: value === "all" ? "" : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Non-Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                   <Label>Lisensi Hampir Habis</Label>
                   <Select
                     value={tempFilters.expiringLicense}
                     onValueChange={(value) => setTempFilters((prev) => ({ ...prev, expiringLicense: value === "all" ? "" : value }))}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Tidak" />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="all">Tidak</SelectItem>
                        <SelectItem value="expiring">Ya (&lt; 30 hari)</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
              </div>
              <SheetFooter className="flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={handleResetFilters}>
                  Reset
                </Button>
                <Button className="flex-1" onClick={handleApplyFilters}>
                  Terapkan Filter
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          </div>
        </section>

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.kabKota && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <MapPin className="h-3 w-3" />
                {kabupatenKotaList?.find(k => k.id === filters.kabKota)?.name || filters.kabKota}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter("kabKota")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.license && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {filters.license}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter("license")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {filters.status === "active" ? "Aktif" : "Non-Aktif"}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 hover:bg-transparent"
                  onClick={() => removeFilter("status")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {filters.expiringLicense && (
                <Badge variant="secondary" className="gap-1 pr-1">
                  Lisensi Hampir Habis
                 <Button
                   variant="ghost"
                   size="icon"
                   className="h-4 w-4 ml-1 hover:bg-transparent"
                   onClick={() => removeFilter("expiringLicense")}
                 >
                   <X className="h-3 w-3" />
                 </Button>
               </Badge>
             )}
          </div>
        )}

        {/* Result context */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isCountLoading ? "Memuat jumlah wasit..." : isCountError ? "Jumlah wasit tidak dapat dimuat." : totalCount ? `Menampilkan ${resultStart}–${resultEnd} dari ${totalCount} wasit` : "0 wasit"}
          </p>
          {hasQuery && <p className="text-xs text-muted-foreground">Hasil pencarian untuk “{searchQuery}”</p>}
        </div>

        {/* Referee Grid/List */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3" aria-label="Memuat daftar wasit">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Card key={item}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <p className="text-sm text-muted-foreground">Data wasit tidak dapat dimuat.</p>
              <Button variant="outline" onClick={retryList}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Coba lagi
              </Button>
            </CardContent>
          </Card>
        ) : referees && referees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {referees.map((referee) => (
              <Link key={referee.id} to={`/referees/${referee.id}`} className="group min-w-0">
                <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/20 group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-ring">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-14 w-14">
                        <AvatarImage src={referee.profile_photo_url || ""} alt={`Foto ${referee.full_name}`} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {referee.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{referee.full_name}</h3>
                            {referee.license_level && (
                              <Badge variant="outline" className={`text-xs ${getLicenseBadgeColor(referee.license_level)}`}>
                                {formatLicenseLevel(referee.license_level)}
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                        {referee.kabupaten_kota_name && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {referee.kabupaten_kota_name}
                          </div>
                        )}
                        {referee.afk_origin && (
                          <p className="text-xs text-muted-foreground mt-1">
                            AFK: {referee.afk_origin}
                          </p>
                        )}
                        <div className="mt-2">
                          <StatusBadge status={referee.is_active ? "success" : "neutral"}>
                            {referee.is_active ? "Aktif" : "Non-Aktif"}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                {hasQuery || activeFilterCount > 0
                  ? "Wasit tidak ditemukan. Coba ubah kata kunci atau filter."
                  : "Belum ada data wasit."}
              </p>
              {(hasQuery || activeFilterCount > 0) && (
                <Button variant="link" onClick={() => { setSearchQuery(""); handleResetFilters(); }}>
                  Reset pencarian dan filter
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && currentPage < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

      </div>
    </AppLayout>
  );
}
