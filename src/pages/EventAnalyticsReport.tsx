import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
 import { Loader2, Download, Clock, CheckCircle, Filter, TrendingUp, Users, FileText } from "lucide-react";
import { useEventAnalytics, exportToCSV } from "@/hooks/useAnalytics";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { useCurrentYear } from "@/contexts/CurrentYearContext";
import { getAnnualReportPeriod, getAvailableReportYears } from "@/lib/annualReporting";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

export default function EventAnalyticsReport() {
  const { currentYear } = useCurrentYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [kabupatenKotaId, setKabupatenKotaId] = useState<string>("");
  const { startDate, endDateExclusive } = getAnnualReportPeriod(selectedYear);

  useEffect(() => {
    setSelectedYear(currentYear);
  }, [currentYear]);

  const { data: analyticsData, isLoading } = useEventAnalytics({
    startDate,
    endDate: endDateExclusive,
    kabupatenKotaId: kabupatenKotaId || undefined,
  });

  const { data: kabupatenKotaList } = useKabupatenKotaList();

   const handleExportCSV = () => {
    if (!analyticsData || analyticsData.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }

    const columns = [
      { key: "event_name", label: "Nama Event" },
      { key: "status", label: "Status" },
      { key: "category", label: "Kategori" },
      { key: "kabupaten_kota_name", label: "Kab/Kota" },
      { key: "submitted_at", label: "Tanggal Diajukan" },
      { key: "approved_at", label: "Tanggal Disetujui" },
      { key: "approval_time_hours", label: "Waktu Approval (jam)" },
      { key: "assigned_referees", label: "Jumlah Wasit" },
    ];

    const filename = `event-analytics-${selectedYear}.csv`;
    exportToCSV(analyticsData, filename, columns);
     toast.success(`${analyticsData.length} data event berhasil di-export ke CSV`);
   };

   const handleExportPDF = async () => {
     toast.info("Fitur PDF export akan segera tersedia");
  };

  // Calculate stats
  const totalEvents = analyticsData?.length || 0;
  const completedEvents = analyticsData?.filter(e => e.status === "SELESAI").length || 0;
  const approvedEvents = analyticsData?.filter(e => e.approved_at).length || 0;
  
  const approvalTimes = analyticsData
    ?.filter(e => e.approval_time_hours !== null)
    .map(e => e.approval_time_hours!) || [];
  
  const avgApprovalTime = approvalTimes.length > 0
    ? approvalTimes.reduce((sum, t) => sum + t, 0) / approvalTimes.length
    : 0;

  // Status distribution
  const statusDist = analyticsData?.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const statusChartData = Object.entries(statusDist).map(([status, count]) => ({
    name: status,
    value: count,
  }));

  // Regional distribution (top 10)
  const regionalDist = analyticsData?.reduce((acc, e) => {
    const region = e.kabupaten_kota_name || "Tidak Diketahui";
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const regionalChartData = Object.entries(regionalDist)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <AppLayout title="Analisis Event">
      <div className="p-4 space-y-6 pb-24">
        {/* Filter Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter Laporan
            </CardTitle>
            <CardDescription>
              Pilih rentang tanggal dan wilayah untuk melihat analisis event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tahun Laporan</Label>
                <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getAvailableReportYears(currentYear).map((year) => (
                      <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <p className="text-sm text-muted-foreground">Periode: 1 Januari {selectedYear} - 31 Desember {selectedYear}</p>
             <div className="flex justify-end gap-2">
               <Button onClick={handleExportPDF} disabled={isLoading || !analyticsData?.length} variant="default">
                 <FileText className="h-4 w-4 mr-2" />
                 Export PDF
               </Button>
               <Button onClick={handleExportCSV} disabled={isLoading || !analyticsData?.length} variant="outline">
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
                  <p className="text-2xl font-bold">{totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Total Event</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{completedEvents}</p>
                  <p className="text-xs text-muted-foreground">Event Selesai</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{avgApprovalTime.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Rata-rata Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-info" />
                <div>
                  <p className="text-2xl font-bold">{approvedEvents}</p>
                  <p className="text-xs text-muted-foreground">Event Disetujui</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
           <Card id="status-chart">
            <CardHeader>
              <CardTitle className="text-base">Distribusi Status Event</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

           <Card id="regional-chart">
            <CardHeader>
              <CardTitle className="text-base">Distribusi Regional (Top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event Table */}
        <Card>
          <CardHeader>
            <CardTitle>Data Event</CardTitle>
            <CardDescription>
              Menampilkan {analyticsData?.length || 0} event dengan waktu approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : analyticsData && analyticsData.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Event</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Wilayah</TableHead>
                      <TableHead>Waktu Approval</TableHead>
                      <TableHead className="text-center">Wasit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsData.map((event) => (
                      <TableRow key={event.event_id}>
                        <TableCell className="font-medium">{event.event_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              event.status === "SELESAI"
                                ? "default"
                                : event.status === "DISETUJUI"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.category || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {event.kabupaten_kota_name || "-"}
                        </TableCell>
                        <TableCell>
                          {event.approval_time_hours !== null ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span>{event.approval_time_hours.toFixed(1)}h</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{event.assigned_referees}</Badge>
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