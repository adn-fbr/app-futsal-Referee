import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  User, 
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  Download,
  Users,
  BadgeCheck,
  AlertCircle,
  Loader2,
  FileText,
  Check,
  X
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRefereeIncomeSummary, formatCurrency, RefereeIncomeSummary } from "@/hooks/useReports";
import { useHonors, useVerifyHonor, useRejectHonor, Honor, HonorStatus, getHonorStatusDisplay } from "@/hooks/useHonors";
import { useKabupatenKota } from "@/hooks/useUsers";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

type RefereeStatus = "all_verified" | "has_pending" | "no_submission";

const getStatusConfig = (summary: RefereeIncomeSummary): { status: RefereeStatus; label: string; variant: "success" | "warning" | "neutral"; icon: typeof CheckCircle2 } => {
  if (summary.verified_count === 0 && summary.pending_count === 0) {
    return { 
      status: "no_submission",
      label: "Belum Ada", 
      variant: "neutral",
      icon: XCircle,
    };
  }
  if (summary.pending_count > 0) {
    return { 
      status: "has_pending",
      label: "Ada Pending", 
      variant: "warning",
      icon: Clock,
    };
  }
  return { 
    status: "all_verified",
    label: "Terverifikasi", 
    variant: "success",
    icon: CheckCircle2,
  };
};

export default function AdminHonorMonitoring() {
  const { kabupatenKotaId, isAdminProvinsi } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterKabKota, setFilterKabKota] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedReferee, setSelectedReferee] = useState<RefereeIncomeSummary | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Honor detail states
  const [honorStatusFilter, setHonorStatusFilter] = useState<"all" | HonorStatus>("all");
  const [selectedHonor, setSelectedHonor] = useState<Honor | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [verificationAmount, setVerificationAmount] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: kabupatenKotaList } = useKabupatenKota();
  
  // Calculate date filters based on period
  const dateFilters = useMemo(() => {
    const now = new Date();
    switch (filterPeriod) {
      case "this_month":
        return { 
          startDate: format(startOfMonth(now), "yyyy-MM-dd"),
          endDate: format(endOfMonth(now), "yyyy-MM-dd")
        };
      case "3_months":
        return { 
          startDate: format(subMonths(now, 3), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd")
        };
      case "6_months":
        return { 
          startDate: format(subMonths(now, 6), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd")
        };
      case "this_year":
        return { 
          startDate: format(new Date(now.getFullYear(), 0, 1), "yyyy-MM-dd"),
          endDate: format(now, "yyyy-MM-dd")
        };
      default:
        return { startDate: null, endDate: null };
    }
  }, [filterPeriod]);

  // Apply regional filter for admin kab/kota
  const effectiveKabKotaId = !isAdminProvinsi() 
    ? kabupatenKotaId 
    : filterKabKota !== "all" ? filterKabKota : null;

  const { data: refereeSummaries, isLoading } = useRefereeIncomeSummary({
    kabupatenKotaId: effectiveKabKotaId,
    startDate: dateFilters.startDate,
    endDate: dateFilters.endDate,
  });

  // Fetch honors when a referee is selected
  const { data: refereeHonors, isLoading: honorsLoading } = useHonors({
    refereeId: selectedReferee?.referee_id,
  });

  const verifyHonor = useVerifyHonor();
  const rejectHonor = useRejectHonor();

  // Filter honors by status
  const filteredHonors = useMemo(() => {
    if (!refereeHonors) return [];
    if (honorStatusFilter === "all") return refereeHonors;
    return refereeHonors.filter(h => h.status === honorStatusFilter);
  }, [refereeHonors, honorStatusFilter]);

  // Handle verify
  const handleVerify = async () => {
    if (!selectedHonor) return;

    const amount = Number(verificationAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    await verifyHonor.mutateAsync({
      id: selectedHonor.id,
      amount,
      notes: undefined,
    });

    setShowVerifyDialog(false);
    setSelectedHonor(null);
    setVerificationAmount("");
  };

  // Handle reject
  const handleReject = async () => {
    if (!selectedHonor || !rejectReason.trim()) return;

    await rejectHonor.mutateAsync({
      id: selectedHonor.id,
      reason: rejectReason.trim(),
    });

    setShowRejectDialog(false);
    setSelectedHonor(null);
    setRejectReason("");
  };

  // Reset honor filters when dialog closes
  const handleCloseDetailDialog = () => {
    setSelectedReferee(null);
    setHonorStatusFilter("all");
  };

  const periodOptions = [
    { value: "all", label: "Semua Periode" },
    { value: "this_month", label: "Bulan Ini" },
    { value: "3_months", label: "3 Bulan Terakhir" },
    { value: "6_months", label: "6 Bulan Terakhir" },
    { value: "this_year", label: "Tahun Ini" },
  ];

  const filteredReferees = useMemo(() => {
    return (refereeSummaries || []).filter((referee) => {
      const matchesSearch = referee.referee_name.toLowerCase().includes(searchQuery.toLowerCase());
      const statusConfig = getStatusConfig(referee);
      const matchesStatus = filterStatus === "all" || statusConfig.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [refereeSummaries, searchQuery, filterStatus]);

  const totalVerifiedAmount = filteredReferees.reduce((sum, r) => sum + r.total_verified_income, 0);
  const totalPendingAmount = filteredReferees.reduce((sum, r) => sum + r.total_pending_income, 0);
  const totalReferees = filteredReferees.length;
  const refereesWithPending = filteredReferees.filter(r => r.pending_count > 0).length;

  const activeFiltersCount = [
    isAdminProvinsi() && filterKabKota !== "all" ? 1 : 0, 
    filterPeriod !== "all" ? 1 : 0, 
    filterStatus !== "all" ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    if (isAdminProvinsi()) setFilterKabKota("all");
    setFilterPeriod("all");
    setFilterStatus("all");
    setSearchQuery("");
  };

  const handleExport = () => {
    if (!filteredReferees.length) return;
    
    const headers = ["Nama Wasit", "Kab/Kota", "Total Terverifikasi", "Total Pending", "Jumlah Verified", "Jumlah Pending"];
    const rows = filteredReferees.map(r => [
      r.referee_name,
      r.kabupaten_kota_name || "-",
      r.total_verified_income.toString(),
      r.total_pending_income.toString(),
      r.verified_count.toString(),
      r.pending_count.toString(),
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `honor-wasit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  return (
    <AppLayout title="Monitoring Honor Wasit">
      <div className="min-h-screen pb-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{totalReferees}</p>
                <p className="text-xs text-muted-foreground">Total Wasit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <BadgeCheck className="h-4 w-4 text-success" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-success">{formatCurrency(totalVerifiedAmount)}</p>
                <p className="text-xs text-muted-foreground">Total Terverifikasi</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-warning/10 rounded-lg">
                    <Clock className="h-4 w-4 text-warning" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-warning">{formatCurrency(totalPendingAmount)}</p>
                <p className="text-xs text-muted-foreground">Total Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{refereesWithPending}</p>
                <p className="text-xs text-muted-foreground">Wasit Perlu Verifikasi</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="p-4 space-y-3 border-b border-border bg-background sticky top-0 z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama wasit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Mobile Filter Button */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden relative">
                  <Filter className="h-4 w-4" />
                  {activeFiltersCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-auto">
                <SheetHeader>
                  <SheetTitle>Filter</SheetTitle>
                  <SheetDescription>Filter data honor wasit</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 py-4">
                  {isAdminProvinsi() && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Kab/Kota</label>
                      <Select value={filterKabKota} onValueChange={setFilterKabKota}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Kab/Kota" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua Kab/Kota</SelectItem>
                          {kabupatenKotaList?.map((kk) => (
                            <SelectItem key={kk.id} value={kk.id}>{kk.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Periode</label>
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Periode" />
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="all_verified">Terverifikasi</SelectItem>
                        <SelectItem value="has_pending">Ada Pending</SelectItem>
                        <SelectItem value="no_submission">Belum Ada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1" onClick={clearFilters}>
                      Reset
                    </Button>
                    <Button className="flex-1" onClick={() => setShowFilters(false)}>
                      Terapkan
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Export Button */}
            <Button variant="outline" size="icon" onClick={handleExport} disabled={!filteredReferees.length}>
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden lg:flex gap-3">
            {isAdminProvinsi() && (
              <Select value={filterKabKota} onValueChange={setFilterKabKota}>
                <SelectTrigger className="w-[180px]">
                  <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Kab/Kota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kab/Kota</SelectItem>
                  {kabupatenKotaList?.map((kk) => (
                    <SelectItem key={kk.id} value={kk.id}>{kk.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="all_verified">Terverifikasi</SelectItem>
                <SelectItem value="has_pending">Ada Pending</SelectItem>
                <SelectItem value="no_submission">Belum Ada</SelectItem>
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block p-4">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Wasit</TableHead>
                      <TableHead>Kab/Kota</TableHead>
                      <TableHead className="text-right">Total Terverifikasi</TableHead>
                      <TableHead className="text-right">Total Pending</TableHead>
                      <TableHead className="text-center">Verified</TableHead>
                      <TableHead className="text-center">Pending</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p className="font-medium">Tidak ada data</p>
                          <p className="text-sm">Coba ubah filter pencarian</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredReferees.map((referee) => {
                        const statusConfig = getStatusConfig(referee);
                        return (
                          <TableRow 
                            key={referee.referee_id} 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => setSelectedReferee(referee)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{referee.referee_name}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{referee.kabupaten_kota_name || "-"}</TableCell>
                            <TableCell className="text-right font-medium text-success">
                              {formatCurrency(referee.total_verified_income)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-warning">
                              {formatCurrency(referee.total_pending_income)}
                            </TableCell>
                            <TableCell className="text-center">{referee.verified_count}</TableCell>
                            <TableCell className="text-center">{referee.pending_count}</TableCell>
                            <TableCell className="text-center">
                              <StatusBadge status={statusConfig.variant}>
                                {statusConfig.label}
                              </StatusBadge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden p-4">
              <ScrollArea className="h-[calc(100vh-380px)]">
                <div className="space-y-3">
                  {filteredReferees.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p className="font-medium">Tidak ada data</p>
                      <p className="text-sm">Coba ubah filter pencarian</p>
                    </div>
                  ) : (
                    filteredReferees.map((referee) => {
                      const statusConfig = getStatusConfig(referee);
                      return (
                        <Card 
                          key={referee.referee_id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setSelectedReferee(referee)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{referee.referee_name}</p>
                                  <p className="text-xs text-muted-foreground">{referee.kabupaten_kota_name || "-"}</p>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Terverifikasi</p>
                                <p className="font-medium text-success">{formatCurrency(referee.total_verified_income)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Pending</p>
                                <p className="font-medium text-warning">{formatCurrency(referee.total_pending_income)}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-3 pt-3 border-t">
                              <span className="text-xs text-muted-foreground">
                                {referee.verified_count} verified, {referee.pending_count} pending
                              </span>
                              <StatusBadge status={statusConfig.variant}>
                                {statusConfig.label}
                              </StatusBadge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
      </div>

      {/* Referee Detail Dialog */}
      <Dialog open={!!selectedReferee} onOpenChange={handleCloseDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detail Honor Wasit</DialogTitle>
            <DialogDescription>
              Informasi lengkap honor {selectedReferee?.referee_name}
            </DialogDescription>
          </DialogHeader>
          {selectedReferee && (
            <div className="space-y-4 overflow-y-auto flex-1">
              {/* Referee Info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold">{selectedReferee.referee_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReferee.kabupaten_kota_name || "-"}</p>
                </div>
              </div>
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-success/5 border-success/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Terverifikasi</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(selectedReferee.total_verified_income)}</p>
                    <p className="text-xs text-muted-foreground">{selectedReferee.verified_count} transaksi</p>
                  </CardContent>
                </Card>
                <Card className="bg-warning/5 border-warning/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Pending</p>
                    <p className="text-lg font-bold text-warning">{formatCurrency(selectedReferee.total_pending_income)}</p>
                    <p className="text-xs text-muted-foreground">{selectedReferee.pending_count} transaksi</p>
                  </CardContent>
                </Card>
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Ditolak</p>
                    <p className="text-lg font-bold text-destructive">{selectedReferee.rejected_count}</p>
                    <p className="text-xs text-muted-foreground">transaksi</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Honor List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Daftar Honor</h4>
                  <Select 
                    value={honorStatusFilter} 
                    onValueChange={(v) => setHonorStatusFilter(v as "all" | HonorStatus)}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="submitted">Menunggu</SelectItem>
                      <SelectItem value="verified">Terverifikasi</SelectItem>
                      <SelectItem value="rejected">Ditolak</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {honorsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredHonors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Tidak ada data honor</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3 pr-4">
                      {filteredHonors.map((honor) => {
                        const statusDisplay = getHonorStatusDisplay(honor.status);
                        return (
                          <Card key={honor.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <p className="font-medium truncate">
                                      {honor.events?.name || "Event tidak tersedia"}
                                    </p>
                                  </div>
                                  <div className="text-sm text-muted-foreground space-y-1">
                                    {honor.events && (
                                      <p>
                                        {format(new Date(honor.events.start_date), "dd MMM yyyy")}
                                        {honor.events.end_date !== honor.events.start_date && 
                                          ` - ${format(new Date(honor.events.end_date), "dd MMM yyyy")}`}
                                      </p>
                                    )}
                                    <p className="text-lg font-semibold text-foreground">
                                      {formatCurrency(honor.amount)}
                                    </p>
                                    {honor.notes && (
                                      <p className="text-xs italic">Catatan: {honor.notes}</p>
                                    )}
                                  </div>
                                </div>
                                <StatusBadge status={statusDisplay.variant}>
                                  {statusDisplay.label}
                                </StatusBadge>
                              </div>

                              {/* Verification Info */}
                              {honor.status === "verified" && honor.verified_at && (
                                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-success" />
                                  <span>
                                    Diverifikasi {format(new Date(honor.verified_at), "dd MMM yyyy")}
                                  </span>
                                </div>
                              )}

                              {honor.status === "rejected" && (
                                <div className="mt-3 pt-3 border-t text-xs text-destructive flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  <span>Ditolak{honor.notes && `: ${honor.notes}`}</span>
                                </div>
                              )}

                              {/* Action Buttons for Submitted */}
                              {honor.status === "submitted" && (
                                <div className="mt-3 pt-3 border-t flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 text-success border-success/30 hover:bg-success/10"
                                    onClick={() => {
                                      setSelectedHonor(honor);
                                      setVerificationAmount(String(honor.amount));
                                      setShowVerifyDialog(true);
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Verifikasi
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={() => {
                                      setSelectedHonor(honor);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Tolak
                                  </Button>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Dialog */}
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikasi Honor</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin memverifikasi honor berikut?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedHonor && (
            <div className="py-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event:</span>
                <span className="font-medium">{selectedHonor.events?.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jumlah diajukan:</span>
                <span className="font-medium text-success">{formatCurrency(selectedHonor.amount)}</span>
              </div>
              <div className="space-y-2">
                <label htmlFor="verification-amount" className="text-sm font-medium">Jumlah yang diverifikasi</label>
                <Input
                  id="verification-amount"
                  type="number"
                  min="1"
                  value={verificationAmount}
                  onChange={(event) => setVerificationAmount(event.target.value)}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={verifyHonor.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleVerify}
              disabled={verifyHonor.isPending || !Number.isFinite(Number(verificationAmount)) || Number(verificationAmount) <= 0}
              className="bg-success hover:bg-success/90"
            >
              {verifyHonor.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Ya, Verifikasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Honor</AlertDialogTitle>
            <AlertDialogDescription>
              Berikan alasan penolakan honor ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedHonor && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-medium">{selectedHonor.events?.name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah:</span>
                  <span className="font-medium">{formatCurrency(selectedHonor.amount)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Alasan Penolakan *</label>
                <Textarea
                  placeholder="Masukkan alasan penolakan..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={rejectHonor.isPending}
              onClick={() => setRejectReason("")}
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              disabled={rejectHonor.isPending || !rejectReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {rejectHonor.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Ya, Tolak
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
