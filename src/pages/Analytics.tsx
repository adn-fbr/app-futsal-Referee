import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getAllAdminReferees } from "@/repositories/admin-referee-directory";
import { Loader2, Users, Calendar, Wallet, TrendingUp, TrendingDown, FileText, ArrowRight } from "lucide-react";
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
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  muted: "hsl(var(--muted-foreground))",
};

const PIE_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === "number" && entry.name.includes("Honor") 
              ? formatCurrency(entry.value) 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  // Fetch referee statistics
  const { data: refereeStats, isLoading: refereeLoading } = useQuery({
    queryKey: ["analytics-referees"],
    queryFn: async () => {
      const wasitReferees = await getAllAdminReferees();

      // Calculate stats
      const activeCount = wasitReferees.filter(r => r.is_active).length;
      const inactiveCount = wasitReferees.filter(r => !r.is_active).length;

      // By license level
      const byLicenseLevel = wasitReferees.reduce((acc: Record<string, number>, r) => {
        const level = r.license_level || "Tidak Ada";
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      }, {});

      // Get kabupaten names
      const { data: kabupatenData } = await supabase
        .from("kabupaten_kota")
        .select("id, name");

      const kabupatenMap = new Map(kabupatenData?.map(k => [k.id, k.name]) || []);

      // By region
      const byRegion = wasitReferees.reduce((acc: Record<string, number>, r) => {
        const region = r.kabupaten_kota_id ? (kabupatenMap.get(r.kabupaten_kota_id) || "Tidak Diketahui") : "Tidak Diketahui";
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      }, {});

      // Monthly registration trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const count = wasitReferees.filter(r => {
          const createdAt = new Date(r.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }).length;
        monthlyTrend.push({
          month: format(monthStart, "MMM yyyy", { locale: id }),
          count,
        });
      }

      return {
        total: wasitReferees.length,
        active: activeCount,
        inactive: inactiveCount,
        byLicenseLevel: Object.entries(byLicenseLevel).map(([name, value]) => ({ name, value })),
        byRegion: Object.entries(byRegion)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10),
        monthlyTrend,
      };
    },
  });

  // Fetch event statistics
  const { data: eventStats, isLoading: eventLoading } = useQuery({
    queryKey: ["analytics-events"],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("events")
        .select("id, status, start_date, end_date, category, kabupaten_kota_id, created_at")
        .is("deleted_at", null);

      if (error) throw error;

      // By status
      const byStatus = events?.reduce((acc: Record<string, number>, e) => {
        acc[e.status || "UNKNOWN"] = (acc[e.status || "UNKNOWN"] || 0) + 1;
        return acc;
      }, {}) || {};

      // By category
      const byCategory = events?.reduce((acc: Record<string, number>, e) => {
        const cat = e.category || "Lainnya";
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {}) || {};

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        const monthEvents = events?.filter(e => {
          const eventDate = new Date(e.start_date);
          return eventDate >= monthStart && eventDate <= monthEnd;
        }) || [];

        monthlyTrend.push({
          month: format(monthStart, "MMM yyyy", { locale: id }),
          total: monthEvents.length,
          selesai: monthEvents.filter(e => e.status === "SELESAI").length,
          disetujui: monthEvents.filter(e => e.status === "DISETUJUI").length,
        });
      }

      const statusLabels: Record<string, string> = {
        DIAJUKAN: "Diajukan",
        DISETUJUI: "Disetujui",
        DITOLAK: "Ditolak",
        SELESAI: "Selesai",
      };

      return {
        total: events?.length || 0,
        completed: events?.filter(e => e.status === "SELESAI").length || 0,
        approved: events?.filter(e => e.status === "DISETUJUI").length || 0,
        pending: events?.filter(e => e.status === "DIAJUKAN").length || 0,
        byStatus: Object.entries(byStatus).map(([name, value]) => ({ 
          name: statusLabels[name] || name, 
          value 
        })),
        byCategory: Object.entries(byCategory).map(([name, value]) => ({ name, value })),
        monthlyTrend,
      };
    },
  });

  // Fetch honor statistics
  const { data: honorStats, isLoading: honorLoading } = useQuery({
    queryKey: ["analytics-honors"],
    queryFn: async () => {
      const { data: honors, error } = await supabase
        .from("honors")
        .select("id, amount, status, created_at, verified_at")
        .is("deleted_at", null);

      if (error) throw error;

      // By status
      const verified = honors?.filter(h => h.status === "verified") || [];
      const pending = honors?.filter(h => h.status === "submitted") || [];
      const draft = honors?.filter(h => h.status === "draft") || [];
      const rejected = honors?.filter(h => h.status === "rejected") || [];

      const totalVerified = verified.reduce((sum, h) => sum + h.amount, 0);
      const totalPending = pending.reduce((sum, h) => sum + h.amount, 0);
      const totalDraft = draft.reduce((sum, h) => sum + h.amount, 0);

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const monthHonors = honors?.filter(h => {
          const createdAt = new Date(h.created_at);
          return createdAt >= monthStart && createdAt <= monthEnd;
        }) || [];

        const verifiedAmount = monthHonors
          .filter(h => h.status === "verified")
          .reduce((sum, h) => sum + h.amount, 0);

        const pendingAmount = monthHonors
          .filter(h => h.status === "submitted")
          .reduce((sum, h) => sum + h.amount, 0);

        monthlyTrend.push({
          month: format(monthStart, "MMM yyyy", { locale: id }),
          verified: verifiedAmount,
          pending: pendingAmount,
        });
      }

      return {
        totalVerified,
        totalPending,
        totalDraft,
        verifiedCount: verified.length,
        pendingCount: pending.length,
        draftCount: draft.length,
        rejectedCount: rejected.length,
        byStatus: [
          { name: "Terverifikasi", value: verified.length },
          { name: "Diajukan", value: pending.length },
          { name: "Draft", value: draft.length },
          { name: "Ditolak", value: rejected.length },
        ].filter(s => s.value > 0),
        monthlyTrend,
      };
    },
  });

  const isLoading = refereeLoading || eventLoading || honorLoading;

  if (isLoading) {
    return (
      <AppLayout title="Analytics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Analytics">
      <div className="p-4 space-y-6 animate-fade-in pb-24">
        {/* Quick Access to Detailed Reports */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Laporan Performa Wasit</h3>
                  <p className="text-sm text-muted-foreground">
                    Analisis detail performa individual wasit dengan metrik event, rating, dan honor
                  </p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <Button asChild className="mt-4 w-full" variant="default">
                <Link to="/reports/referee-performance">
                  Lihat Laporan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">Analisis Event</h3>
                  <p className="text-sm text-muted-foreground">
                    Metrik waktu approval, distribusi regional, dan statistik event komprehensif
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <Button asChild className="mt-4 w-full" variant="default">
                <Link to="/reports/event-analytics">
                  Lihat Analisis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{refereeStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Wasit</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{eventStats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Event</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold">{formatCurrency(honorStats?.totalVerified || 0)}</p>
                  <p className="text-xs text-muted-foreground">Honor Terverifikasi</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{eventStats?.completed || 0}</p>
                  <p className="text-xs text-muted-foreground">Event Selesai</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed analytics */}
        <Tabs defaultValue="wasit" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="wasit">Wasit</TabsTrigger>
            <TabsTrigger value="event">Event</TabsTrigger>
            <TabsTrigger value="honor">Honor</TabsTrigger>
          </TabsList>

          {/* Wasit Tab */}
          <TabsContent value="wasit" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Active vs Inactive */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Wasit</CardTitle>
                  <CardDescription>Perbandingan wasit aktif dan non-aktif</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Aktif", value: refereeStats?.active || 0 },
                            { name: "Non-Aktif", value: refereeStats?.inactive || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill={COLORS.success} />
                          <Cell fill={COLORS.muted} />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* By License Level */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tingkat Lisensi</CardTitle>
                  <CardDescription>Distribusi wasit berdasarkan level lisensi</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={refereeStats?.byLicenseLevel || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Jumlah" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Registration Trend */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tren Registrasi Wasit</CardTitle>
                  <CardDescription>Jumlah wasit baru per bulan (6 bulan terakhir)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={refereeStats?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          name="Wasit Baru"
                          stroke={COLORS.primary} 
                          fill={COLORS.primary}
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* By Region */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Distribusi per Wilayah</CardTitle>
                  <CardDescription>Top 10 kabupaten/kota dengan wasit terbanyak</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={refereeStats?.byRegion || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Jumlah Wasit" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Event Tab */}
          <TabsContent value="event" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* By Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Event</CardTitle>
                  <CardDescription>Distribusi event berdasarkan status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={eventStats?.byStatus || []}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {eventStats?.byStatus?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* By Category */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Kategori Event</CardTitle>
                  <CardDescription>Distribusi event berdasarkan kategori</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={eventStats?.byCategory || []} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Jumlah" fill={COLORS.success} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Event Trend */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tren Event Bulanan</CardTitle>
                  <CardDescription>Jumlah event per bulan (6 bulan terakhir)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={eventStats?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="total" 
                          name="Total Event"
                          stroke={COLORS.primary} 
                          strokeWidth={2}
                          dot={{ fill: COLORS.primary }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="selesai" 
                          name="Selesai"
                          stroke={COLORS.success} 
                          strokeWidth={2}
                          dot={{ fill: COLORS.success }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="disetujui" 
                          name="Disetujui"
                          stroke={COLORS.warning} 
                          strokeWidth={2}
                          dot={{ fill: COLORS.warning }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Honor Tab */}
          <TabsContent value="honor" className="space-y-4">
            {/* Honor Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-xs text-green-600 font-medium">Terverifikasi</p>
                  <p className="text-lg font-bold text-green-700">{formatCurrency(honorStats?.totalVerified || 0)}</p>
                  <p className="text-xs text-green-600">{honorStats?.verifiedCount || 0} transaksi</p>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <p className="text-xs text-yellow-600 font-medium">Menunggu Verifikasi</p>
                  <p className="text-lg font-bold text-yellow-700">{formatCurrency(honorStats?.totalPending || 0)}</p>
                  <p className="text-xs text-yellow-600">{honorStats?.pendingCount || 0} transaksi</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-600 font-medium">Draft</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(honorStats?.totalDraft || 0)}</p>
                  <p className="text-xs text-gray-600">{honorStats?.draftCount || 0} transaksi</p>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <p className="text-xs text-red-600 font-medium">Ditolak</p>
                  <p className="text-lg font-bold text-red-700">{honorStats?.rejectedCount || 0}</p>
                  <p className="text-xs text-red-600">transaksi</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* By Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Status Honor</CardTitle>
                  <CardDescription>Distribusi honor berdasarkan status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={honorStats?.byStatus || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {honorStats?.byStatus?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Honor Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Tren Honor Bulanan</CardTitle>
                  <CardDescription>Jumlah honor per bulan (6 bulan terakhir)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={honorStats?.monthlyTrend || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`} />
                        <Tooltip 
                          content={<CustomTooltip />}
                          formatter={(value: number) => formatCurrency(value)}
                        />
                        <Legend />
                        <Bar 
                          dataKey="verified" 
                          name="Honor Terverifikasi" 
                          fill={COLORS.success} 
                          radius={[4, 4, 0, 0]}
                          stackId="stack"
                        />
                        <Bar 
                          dataKey="pending" 
                          name="Honor Pending" 
                          fill={COLORS.warning} 
                          radius={[4, 4, 0, 0]}
                          stackId="stack"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
