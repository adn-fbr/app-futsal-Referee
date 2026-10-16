import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
 import { Loader2, Download, Star, TrendingUp, Calendar, Wallet, Filter, FileText } from "lucide-react";
import { useRefereePerformance, exportToCSV } from "@/hooks/useAnalytics";
 import { supabase } from "@/integrations/supabase/client";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { formatLicenseLevel } from "@/lib/formatters";
 import { format, subMonths } from "date-fns";
 import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";

export default function RefereePerformanceReport() {
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 6), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [kabupatenKotaId, setKabupatenKotaId] = useState<string>("");

  const { data: performanceData, isLoading } = useRefereePerformance({
    startDate,
    endDate,
    kabupatenKotaId: kabupatenKotaId || undefined,
  });

  const { data: kabupatenKotaList } = useKabupatenKotaList();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

   const handleExportCSV = () => {
    if (!performanceData || performanceData.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }

    const columns = [
      { key: "referee_name", label: "Nama Wasit" },
      { key: "kabupaten_kota_name", label: "Kab/Kota" },
      { key: "license_level", label: "Lisensi" },
      { key: "total_events", label: "Total Event" },
      { key: "completed_events", label: "Event Selesai" },
      { key: "avg_rating", label: "Rating Rata-rata" },
      { key: "total_reviews", label: "Jumlah Review" },
      { key: "total_verified_income", label: "Honor Terverifikasi" },
      { key: "total_pending_income", label: "Honor Pending" },
      { key: "is_active", label: "Status" },
    ];

    const filename = `referee-performance-${startDate}-to-${endDate}.csv`;
    exportToCSV(performanceData, filename, columns);
     toast.success(`${performanceData.length} data wasit berhasil di-export ke CSV`);
   };

   const handleExportPDF = async () => {
     toast.info("Fitur PDF export akan segera tersedia");
  };

  // Calculate summary stats
  const totalReferees = performanceData?.length || 0;
  const activeReferees = performanceData?.filter(r => r.is_active).length || 0;
  const totalEvents = performanceData?.reduce((sum, r) => sum + r.total_events, 0) || 0;
  const totalIncome = performanceData?.reduce((sum, r) => sum + r.total_verified_income, 0) || 0;

  return (
    <AppLayout title="Laporan Performa Wasit">
      <div className="p-4 space-y-6 pb-24">
        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
            <CardDescription>
              Pilih rentang tanggal dan wilayah untuk melihat performa wasit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kabupaten/Kota</Label>
                <Select value={kabupatenKotaId} onValueChange={setKabupatenKotaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Wilayah" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Wilayah</SelectItem>
                    {kabupatenKotaList?.map((kab) => (
                      <SelectItem key={kab.id} value={kab.id}>
                        {kab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <div className="flex justify-end gap-2">
               <Button onClick={handleExportPDF} disabled={isLoading || !performanceData?.length} variant="default">
                 <FileText className="h-4 w-4 mr-2" />
                 Export PDF
               </Button>
               <Button onClick={handleExportCSV} disabled={isLoading || !performanceData?.length} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalReferees}</p>
                  <p className="text-xs text-muted-foreground">Total Wasit</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{activeReferees}</p>
                  <p className="text-xs text-muted-foreground">Wasit Aktif</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Total Event</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-info" />
                <div>
                  <p className="text-lg font-bold">{formatCurrency(totalIncome)}</p>
                  <p className="text-xs text-muted-foreground">Total Honor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Performa Wasit</CardTitle>
            <CardDescription>
              Menampilkan {performanceData?.length || 0} wasit diurutkan berdasarkan jumlah event
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : performanceData && performanceData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Wasit</TableHead>
                      <TableHead>Lisensi</TableHead>
                      <TableHead className="text-center">Event</TableHead>
                      <TableHead className="text-center">Selesai</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-right">Honor Verified</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performanceData.map((referee) => (
                      <TableRow key={referee.referee_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={referee.profile_photo_url || ""} />
                              <AvatarFallback>
                                {referee.referee_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{referee.referee_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {referee.kabupaten_kota_name || "-"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {referee.license_level ? (
                            <Badge variant="outline">
                              {formatLicenseLevel(referee.license_level)}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-semibold">{referee.total_events}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {referee.completed_events}
                        </TableCell>
                        <TableCell className="text-center">
                          {referee.total_reviews > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {referee.avg_rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({referee.total_reviews})
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(referee.total_verified_income)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={referee.is_active ? "default" : "secondary"}>
                            {referee.is_active ? "Aktif" : "Non-Aktif"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Tidak ada data untuk ditampilkan
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}