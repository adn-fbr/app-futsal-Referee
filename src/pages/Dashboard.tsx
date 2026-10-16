import { 
  Calendar, 
  Users, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  ClipboardList,
  Building2,
  UserPlus,
  CalendarPlus,
  FileCheck,
  Loader2,
  Database,
  BarChart3,
  ClipboardCheck,
  Settings,
  BookOpen,
  MessageSquare,
  UserCheck,
  Wallet,
  MapPin,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuickActionGrid, QuickActionItem } from "@/components/ui/quick-action-grid";
import { PendingApprovalsWidget } from "@/components/dashboard/PendingApprovalsWidget";
import { IncompleteProfilesBanner } from "@/components/dashboard/IncompleteProfilesBanner";
import { useDashboardSummary, formatCurrency } from "@/hooks/useReports";
import { useAuditLogs, getActionLabel } from "@/hooks/useAuditLogs";
import { useAutoCompleteEvents } from "@/hooks/useAutoCompleteEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentYear } from "@/contexts/CurrentYearContext";
import { useEvents } from "@/hooks/useEvents";
import { getDashboardKpiSummary } from "@/lib/dashboardKpis";
import { getRegionColor } from "@/lib/regionColors";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CurrentYearCard } from "@/components/dashboard/CurrentYearCard";

export default function Dashboard() {
  const { role, kabupatenKotaId, isAdminProvinsi } = useAuth();
  const { currentYear, today } = useCurrentYear();
  
  // Auto-complete events check on page load
  useAutoCompleteEvents();
  
  // Apply regional filter for admin kab/kota
  const filters = isAdminProvinsi() ? {} : { kabupatenKotaId };
  
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(filters);
  const { data: eventRows = [], isLoading: eventsLoading } = useEvents({ kabupatenKotaId: isAdminProvinsi() ? null : kabupatenKotaId });
  const { data: auditLogs, isLoading: logsLoading } = useAuditLogs({ limit: 5 });
  const kpis = useMemo(() => getDashboardKpiSummary(eventRows, { currentYear, today }), [eventRows, currentYear, today]);
  const regionBreakdown = useMemo(() => {
    const seen = new Map<string, { id: string; name: string; count: number }>();
    eventRows.forEach((event) => {
      if (!event.kabupaten_kota_id || !event.kabupaten_kota?.name) return;
      const existing = seen.get(event.kabupaten_kota_id) ?? { id: event.kabupaten_kota_id, name: event.kabupaten_kota.name, count: 0 };
      existing.count += 1;
      seen.set(event.kabupaten_kota_id, existing);
    });
    return [...seen.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [eventRows]);

  const roleLabel = role === "admin_provinsi" ? "Admin Provinsi" : 
                   role === "admin_kab_kota" ? "Admin Kab/Kota" : "Admin";

  // Quick Actions for all admins
  const baseQuickActions: QuickActionItem[] = [
    { 
      icon: Calendar, 
      label: "Event", 
      path: "/events",
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary"
    },
    { 
      icon: Users, 
      label: "Wasit", 
      path: "/referees",
      iconBgClass: "bg-info/10",
      iconColorClass: "text-info"
    },
    { 
      icon: FileCheck, 
      label: "Persetujuan", 
      path: "/approvals",
      iconBgClass: "bg-warning/10",
      iconColorClass: "text-warning"
    },
    { 
      icon: ClipboardCheck, 
      label: "Evaluasi", 
      path: "/evaluations",
      iconBgClass: "bg-success/10",
      iconColorClass: "text-success"
    },
  ];

  // Second row of quick actions
  const secondRowActions: QuickActionItem[] = [
    { 
      icon: Building2, 
      label: "Organisasi", 
      path: "/organization",
      iconBgClass: "bg-primary/10",
      iconColorClass: "text-primary"
    },
    { 
      icon: BookOpen, 
      label: "Materi", 
      path: "/admin/learning",
      iconBgClass: "bg-accent/10",
      iconColorClass: "text-accent"
    },
    { 
      icon: MessageSquare, 
      label: "Diskusi", 
      path: "/admin/discussions",
      iconBgClass: "bg-info/10",
      iconColorClass: "text-info"
    },
    { 
      icon: Settings, 
      label: "Pengaturan", 
      path: "/settings",
      iconBgClass: "bg-muted",
      iconColorClass: "text-muted-foreground"
    },
  ];

  // Admin exclusive actions (both admin_provinsi and admin_kab_kota)
  const adminActions: QuickActionItem[] = [
    { 
      icon: Wallet, 
      label: "Honor Wasit", 
      path: "/admin/honor",
      iconBgClass: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColorClass: "text-emerald-600 dark:text-emerald-400"
    },
  ];

  // Admin provinsi exclusive actions
  const adminProvinsiActions: QuickActionItem[] = isAdminProvinsi() ? [
    { 
      icon: BarChart3, 
      label: "Analytics", 
      path: "/analytics",
      iconBgClass: "bg-purple-100 dark:bg-purple-900/30",
      iconColorClass: "text-purple-600 dark:text-purple-400"
    },
    { 
      icon: UserCheck, 
      label: "Persetujuan User", 
      path: "/user-approvals",
      iconBgClass: "bg-warning/10",
      iconColorClass: "text-warning"
    },
    { 
      icon: Database, 
      label: "Export DB", 
      path: "/export",
      iconBgClass: "bg-accent/10",
      iconColorClass: "text-accent"
    },
  ] : [];

  const getActivityIcon = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VERIFIED")) return CheckCircle;
    if (action.includes("REJECT")) return XCircle;
    if (action.includes("SUBMIT")) return CalendarPlus;
    if (action.includes("ASSIGN")) return UserPlus;
    return ClipboardList;
  };

  const getActivityStatus = (action: string) => {
    if (action.includes("APPROVE") || action.includes("VERIFIED") || action.includes("COMPLETE")) return "success";
    if (action.includes("REJECT")) return "error";
    if (action.includes("SUBMIT") || action.includes("PENDING")) return "warning";
    return "info";
  };

  return (
    <AppLayout title="Dashboard">
      <div className="p-4 space-y-5 animate-fade-in pb-24">
        {/* Header Card */}
        <div className="gradient-primary rounded-2xl p-5 text-primary-foreground shadow-lg">
          <StatusBadge status="primary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 mb-2">
            {roleLabel}
          </StatusBadge>
          <h2 className="text-xl font-bold mb-1">Selamat Datang, Admin!</h2>
          <p className="text-sm text-primary-foreground/80">
            Kelola aktivitas futsal Sulawesi Selatan.
          </p>
        </div>

        <CurrentYearCard />

        {/* Incomplete Profiles Banner */}
        <IncompleteProfilesBanner />

        {/* Summary Stats */}
        {summaryLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 divide-x divide-border">
                <div className="text-center px-2">
                  <p className="text-2xl font-bold text-primary">{summary?.total_events || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Total Event</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-2xl font-bold text-primary">{summary?.total_referees || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Total Wasit</p>
                </div>
                <div className="text-center px-2">
                  <p className="text-2xl font-bold text-success">{summary?.completed_events || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Selesai</p>
                </div>
              </div>
              {(summary?.total_verified_income || summary?.total_pending_income) ? (
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Honor Verified</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(summary?.total_verified_income || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Honor Pending</p>
                    <p className="text-lg font-bold text-warning">{formatCurrency(summary?.total_pending_income || 0)}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">KPI Event</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Total Event</p>
                <p className="mt-2 text-2xl font-bold text-primary">{eventsLoading ? "…" : kpis.totalEvents}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Disetujui</p>
                <p className="mt-2 text-2xl font-bold text-success">{kpis.approved}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Selesai</p>
                <p className="mt-2 text-2xl font-bold text-success">{kpis.completed}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Pending</p>
                <p className="mt-2 text-2xl font-bold text-warning">{kpis.pending}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Event Hari Ini</p>
                <p className="mt-2 text-xl font-bold text-primary">{kpis.today}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Event Mendatang</p>
                <p className="mt-2 text-xl font-bold text-info">{kpis.upcoming}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Event Bulan Ini</p>
                <p className="mt-2 text-xl font-bold text-primary">{kpis.thisMonth}</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Ditolak</p>
                <p className="mt-2 text-xl font-bold text-destructive">{kpis.rejected}</p>
              </div>
            </div>

            {isAdminProvinsi() && regionBreakdown.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Event per Kabupaten/Kota</p>
                <div className="space-y-2">
                  {regionBreakdown.map((region) => {
                    const palette = getRegionColor(region.id);
                    return (
                      <Link
                        key={region.id}
                        to={`/events?kabupatenKotaId=${region.id}`}
                        className={`flex items-center justify-between rounded-lg border ${palette.border} ${palette.bg} px-3 py-2`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${palette.dot}`} />
                          <span className="text-sm font-medium">{region.name}</span>
                        </span>
                        <span className="text-sm font-semibold">{region.count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {kpis.attention.length > 0 && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Perlu Perhatian</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {kpis.attention.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-background/50 px-3 py-2">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{item.value}</span>
                    {item.kind === "warning" ? (
                      <Link to="/events?status=DIAJUKAN" className="text-xs text-primary underline">Lihat Event Pending</Link>
                    ) : item.kind === "info" ? (
                      <span className="text-xs text-muted-foreground">Hari Ini</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">7 hari</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals Widget */}
        <PendingApprovalsWidget />

        {/* Quick Actions */}
        <section>
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Akses Cepat
          </h3>
          <QuickActionGrid items={baseQuickActions} columns={4} />
          <div className="mt-3">
            <QuickActionGrid items={secondRowActions} columns={4} />
          </div>
          <div className="mt-3">
            <QuickActionGrid items={[...adminActions, ...adminProvinsiActions]} columns={isAdminProvinsi() ? 4 : 3} />
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
                <Button variant="ghost" size="sm" className="text-primary h-8" asChild>
                  <Link to="/audit-logs">
                    Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-1 pt-0">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : auditLogs && auditLogs.length > 0 ? (
                auditLogs.map((log, index) => {
                  const ActivityIcon = getActivityIcon(log.action);
                  const status = getActivityStatus(log.action);
                  return (
                    <div
                      key={log.id}
                      className={`flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                        index !== auditLogs.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className={`icon-circle-sm flex-shrink-0 ${
                        status === "success" ? "bg-success/10" :
                        status === "warning" ? "bg-warning/10" :
                        status === "error" ? "bg-destructive/10" :
                        "bg-info/10"
                      }`}>
                        <ActivityIcon className={`h-4 w-4 ${
                          status === "success" ? "text-success" :
                          status === "warning" ? "text-warning" :
                          status === "error" ? "text-destructive" :
                          "text-info"
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{getActionLabel(log.action as any)}</p>
                          <StatusBadge 
                            status={status === "success" ? "success" : status === "warning" ? "warning" : status === "error" ? "error" : "info"} 
                            className="flex-shrink-0 text-[10px] px-1.5 py-0"
                          >
                            {status === "success" ? "Selesai" :
                             status === "warning" ? "Menunggu" :
                             status === "error" ? "Ditolak" : "Info"}
                          </StatusBadge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.entity_type} - {log.actor_name || "System"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(log.created_at), "d MMM yyyy HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada aktivitas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
