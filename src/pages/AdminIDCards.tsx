import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IdCard,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MoreVertical,
  Users,
  ShieldCheck,
  ShieldX,
  ShieldOff,
  Loader2,
  ChevronRight,
  QrCode,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  useRefereeCards,
  useRefereeCardsCount,
  useAdminRegenerateCard,
  useUpdateCardStatus,
  useBulkGenerateCards,
  useCardVerificationLogs,
  useVerifyCard,
  RefereeCard,
} from "@/hooks/useRefereeCard";
import { QRScanner } from "@/components/admin/QRScanner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function AdminIDCards() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [selectedCard, setSelectedCard] = useState<RefereeCard | null>(null);
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showScannerDialog, setShowScannerDialog] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const { data: cards, isLoading } = useRefereeCards({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery,
    page: currentPage,
    pageSize: pageSize,
  });
  
  const { data: totalCount = 0 } = useRefereeCardsCount({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery,
  });
  
  const totalPages = Math.ceil(totalCount / pageSize);

  const regenerateCard = useAdminRegenerateCard();
  const updateStatus = useUpdateCardStatus();
  const bulkGenerate = useBulkGenerateCards();
  const { data: logs } = useCardVerificationLogs(selectedCard?.id || "");
  const { data: verifyResult, isLoading: isVerifying } = useVerifyCard(scannedCode || "");

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle scan result
  const handleScanResult = (code: string) => {
    setScannedCode(code);
  };

  // Open verification result in new tab
  const handleViewVerification = () => {
    if (scannedCode) {
      window.open(`/verify/${scannedCode}`, "_blank");
    }
  };

  const stats = {
    total: cards?.length || 0,
    active: cards?.filter((c) => c.status === "active").length || 0,
    suspended: cards?.filter((c) => c.status === "suspended").length || 0,
    revoked: cards?.filter((c) => c.status === "revoked").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <StatusBadge status="success">Aktif</StatusBadge>;
      case "suspended":
        return <StatusBadge status="warning">Suspend</StatusBadge>;
      case "revoked":
        return <StatusBadge status="error">Dicabut</StatusBadge>;
      case "expired":
        return <StatusBadge status="neutral">Kadaluarsa</StatusBadge>;
      default:
        return <StatusBadge status="neutral">{status}</StatusBadge>;
    }
  };

  const handleViewLogs = (card: RefereeCard) => {
    setSelectedCard(card);
    setShowLogsDialog(true);
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Manajemen ID Card</h1>
            <p className="text-muted-foreground text-sm">
              Kelola ID Card digital wasit
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setScannedCode(null);
                setShowScannerDialog(true);
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Scan QR
            </Button>
            <Button
              onClick={() => bulkGenerate.mutate()}
              disabled={bulkGenerate.isPending}
            >
              {bulkGenerate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Users className="h-4 w-4 mr-2" />
              )}
              Generate Massal
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={IdCard}
            title="Total Kartu"
            value={stats.total}
          />
          <StatCard
            icon={ShieldCheck}
            title="Aktif"
            value={stats.active}
          />
          <StatCard
            icon={ShieldOff}
            title="Disuspend"
            value={stats.suspended}
          />
          <StatCard
            icon={ShieldX}
            title="Dicabut"
            value={stats.revoked}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama atau nomor kartu..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="suspended">Disuspend</SelectItem>
                  <SelectItem value="revoked">Dicabut</SelectItem>
                  <SelectItem value="expired">Kadaluarsa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cards List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Daftar ID Card</CardTitle>
              <p className="text-sm text-muted-foreground">
                {totalCount > 0 && `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, totalCount)} dari ${totalCount} kartu`}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !cards || cards.length === 0 ? (
              <div className="text-center py-12">
                <IdCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Belum ada ID Card</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={card.referee?.profile_photo_url || ""} />
                        <AvatarFallback>
                          {card.referee?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">
                            {card.referee?.full_name}
                          </p>
                          {getStatusBadge(card.status)}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {card.card_number}
                        </p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            Verifikasi: {card.verification_count}x
                          </span>
                          <span>
                            Berlaku:{" "}
                            {card.expires_at
                              ? format(new Date(card.expires_at), "dd/MM/yy")
                              : "-"}
                          </span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              window.open(
                                `/verify/${card.verification_code}`,
                                "_blank"
                              )
                            }
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Lihat Verifikasi
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewLogs(card)}>
                            <QrCode className="h-4 w-4 mr-2" />
                            Riwayat Scan
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => regenerateCard.mutate(card.id)}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {card.status === "active" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus.mutate({
                                  cardId: card.id,
                                  status: "suspended",
                                })
                              }
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {card.status === "suspended" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateStatus.mutate({
                                  cardId: card.id,
                                  status: "active",
                                })
                              }
                            >
                              <ShieldCheck className="h-4 w-4 mr-2" />
                              Aktifkan
                            </DropdownMenuItem>
                          )}
                          {card.status !== "revoked" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                updateStatus.mutate({
                                  cardId: card.id,
                                  status: "revoked",
                                })
                              }
                            >
                              <ShieldX className="h-4 w-4 mr-2" />
                              Cabut Kartu
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Verification Logs Dialog */}
        <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Riwayat Verifikasi</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {!logs || logs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada riwayat verifikasi
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <QrCode className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {format(
                          new Date(log.verified_at),
                          "dd MMM yyyy, HH:mm:ss",
                          { locale: id }
                        )}
                      </p>
                      {log.ip_address && (
                        <p className="text-xs text-muted-foreground">
                          IP: {log.ip_address}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* QR Scanner Dialog */}
        <Dialog open={showScannerDialog} onOpenChange={setShowScannerDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Scan ID Card Wasit</DialogTitle>
            </DialogHeader>
            
            {!scannedCode ? (
              <QRScanner
                onScan={handleScanResult}
                onError={(err) => toast.error(err)}
              />
            ) : (
              <div className="space-y-4">
                {isVerifying ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Memverifikasi...</p>
                  </div>
                ) : verifyResult?.valid ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-success/10 mx-auto mb-4 flex items-center justify-center">
                      <ShieldCheck className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="font-bold text-lg text-success mb-1">
                      Kartu Valid
                    </h3>
                    <p className="text-sm font-medium">
                      {verifyResult.card?.referee?.full_name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mb-4">
                      {verifyResult.card?.card_number}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setScannedCode(null)}
                      >
                        Scan Lagi
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleViewVerification}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detail
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
                      <ShieldX className="h-8 w-8 text-destructive" />
                    </div>
                    <h3 className="font-bold text-lg text-destructive mb-1">
                      Kartu Tidak Valid
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {verifyResult?.message || "QR Code tidak dikenali"}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setScannedCode(null)}
                    >
                      Scan Lagi
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
