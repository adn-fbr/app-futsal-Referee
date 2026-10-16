import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Trophy,
  DollarSign,
  Clock,
  CheckCircle2,
  ChevronRight,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowUpRight,
  CreditCard,
  UserRound,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useHonorStats, useHonors } from "@/hooks/useHonors";
import { useUpcomingRefereeEvents, usePendingAssignments } from "@/hooks/useRefereeEvents";
import { useAutoCompleteEvents } from "@/hooks/useAutoCompleteEvents";
import { useAutoGenerateCard, useMyRefereeCard } from "@/hooks/useRefereeCard";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RefereeNav } from "@/components/layout/RefereeNav";
import { formatLicenseLevel, formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { CurrentYearCard } from "@/components/dashboard/CurrentYearCard";

const getHonorStatusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <StatusBadge status="success">Diverifikasi</StatusBadge>;
    case "submitted":
      return <StatusBadge status="warning">Diajukan</StatusBadge>;
    case "draft":
      return <StatusBadge status="neutral">Draft</StatusBadge>;
    case "rejected":
      return <StatusBadge status="error">Ditolak</StatusBadge>;
    default:
      return <StatusBadge status="neutral">{status}</StatusBadge>;
  }
};

const getAssignmentStatus = (status: string) => {
  switch (status) {
    case "confirmed":
      return { label: "Dikonfirmasi", variant: "success" as const };
    case "declined":
      return {
        label: "Ditolak",
        variant: "neutral" as const,
        className: "border-purple-200 bg-purple-50 text-purple-700",
      };
    case "cancelled":
      return { label: "Dibatalkan", variant: "error" as const };
    default:
      return { label: "Menunggu", variant: "warning" as const };
  }
};

const formatEventDate = (date: string | null | undefined) => {
  if (!date) return "Tanggal belum ditentukan";

  return format(new Date(date), "dd MMM yyyy, HH:mm", { locale: id });
};

export default function RefereeDashboard() {
  const [activeTab, setActiveTab] = useState("active");
  
  // Auto-complete events check on page load
  useAutoCompleteEvents();
  
  const { data: profile, isLoading: profileLoading, isError: profileError } = useProfile();
  const { data: honorStats } = useHonorStats();
  const { data: honors } = useHonors();
  const { data: upcomingEvents, isError: eventsError } = useUpcomingRefereeEvents();
  const { data: pendingAssignments } = usePendingAssignments();
  const { data: refereeCard, isLoading: cardLoading } = useMyRefereeCard();
  
  // Auto-generate ID Card on first load
  const autoGenerateCard = useAutoGenerateCard();
  
  useEffect(() => {
    if (profile?.is_profile_complete && !autoGenerateCard.isPending) {
      autoGenerateCard.mutate();
    }
    // Only run once when profile is loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.is_profile_complete]);

  // Get completed honors
  const completedHonors = honors?.filter(h => h.status === "verified") || [];
  const pendingHonors = honors?.filter(h => h.status === "submitted") || [];
  
  const pendingAmount = pendingHonors.reduce((sum, h) => sum + h.amount, 0);

  const quickActions = [
    { 
      icon: CalendarDays, 
      label: "Event Saya", 
      path: "/referee/events",
      iconClass: "bg-primary/10 text-primary",
      badge: pendingAssignments?.length || undefined,
    },
    { 
      icon: BookOpen, 
      label: "Belajar", 
      path: "/referee/learning",
      iconClass: "bg-info/10 text-info",
    },
    { 
      icon: CreditCard,
      label: "ID Card", 
      path: "/referee/id-card",
      iconClass: "bg-accent/10 text-accent",
    },
    { 
      icon: DollarSign, 
      label: "Honor", 
      path: "/referee/honor",
      iconClass: "bg-success/10 text-success",
      badge: pendingHonors.length > 0 ? pendingHonors.length : undefined,
    },
  ];

  const primaryAssignment = pendingAssignments?.[0] || upcomingEvents?.[0];
  const hasPendingAction = Boolean(pendingAssignments?.length);

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Memuat dashboard">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-destructive/20">
          <CardContent className="p-6 text-center">
            <p className="font-semibold">Data belum dapat dimuat</p>
            <p className="mt-1 text-sm text-muted-foreground">Silakan coba lagi beberapa saat.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-primary/10 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar className="h-14 w-14 shrink-0 border-2 border-primary-foreground/25 sm:h-16 sm:w-16">
                <AvatarImage src={profile?.profile_photo_url || ""} alt={profile?.full_name || ""} />
                <AvatarFallback className="bg-primary-foreground/15 text-lg font-bold text-primary-foreground">
                  {profile?.full_name?.split(" ").map((name) => name[0]).join("").slice(0, 2) || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">Dashboard Wasit</p>
                <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">Halo, {profile?.full_name || "Wasit"}</h1>
                <p className="mt-1 text-sm text-primary-foreground/75">Kelola penugasan dan aktivitas perwasitan Anda.</p>
              </div>
            </div>
            <Link to="/referee/profile" aria-label="Buka profil saya">
              <Button variant="outline" size="sm" className="shrink-0 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <UserRound className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Profil</span>
              </Button>
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-primary-foreground/75">
            <StatusBadge status="primary" className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">
              {formatLicenseLevel(profile?.license_level)}
            </StatusBadge>
            <span className="text-primary-foreground/40">/</span>
            <span>{profile?.is_profile_complete ? "Profil lengkap" : "Profil perlu dilengkapi"}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <CurrentYearCard />
        {primaryAssignment && (
          <section aria-labelledby="primary-action-heading">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Prioritas Anda</p>
                <h2 id="primary-action-heading" className="mt-1 text-xl font-bold tracking-tight">
                  {hasPendingAction ? "Konfirmasi penugasan" : "Penugasan berikutnya"}
                </h2>
              </div>
              <Link to="/referee/events" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                  Semua penugasan <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <Link to="/referee/events" className="block">
              <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/65">Penugasan terbaru</span>
                        <StatusBadge status={hasPendingAction ? "warning" : "success"} className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
                          {hasPendingAction ? "Menunggu konfirmasi" : "Terjadwal"}
                        </StatusBadge>
                      </div>
                      <h3 className="mt-3 truncate text-xl font-bold sm:text-2xl">{primaryAssignment.event?.name || "Event belum tersedia"}</h3>
                      <div className="mt-4 grid gap-3 text-sm text-primary-foreground/80 sm:grid-cols-2">
                        <span className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0" />{formatEventDate(primaryAssignment.event?.start_date)}</span>
                        <span className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{primaryAssignment.event?.location || "Lokasi belum ditentukan"}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-5 border-t border-primary-foreground/15 pt-4 lg:min-w-44 lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-primary-foreground/60">Peran</p>
                        <p className="mt-1 font-bold">{primaryAssignment.role === "UTAMA" ? "Wasit 1" : "Wasit Cadangan"}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-semibold">Lihat penugasan <ChevronRight className="h-4 w-4" /></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        {!primaryAssignment && !eventsError && (
          <Card className="border-dashed border-primary/25 bg-primary/[0.03]">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center sm:p-10">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"><CalendarDays className="h-6 w-6" /></div>
              <h2 className="text-lg font-bold">Tidak ada tindakan yang perlu dilakukan</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Penugasan wasit Anda akan muncul di sini ketika tersedia.</p>
            </CardContent>
          </Card>
        )}

        <section aria-label="Ringkasan aktivitas" className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/80 shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning"><Clock className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold leading-none">{pendingAssignments?.length || 0}</p><p className="mt-1 text-xs text-muted-foreground">Menunggu konfirmasi</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Trophy className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold leading-none">{upcomingEvents?.length || 0}</p><p className="mt-1 text-xs text-muted-foreground">Event mendatang</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-none">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success"><CheckCircle2 className="h-5 w-5" /></div>
              <div><p className="text-lg font-bold leading-none">{formatCompactCurrency(honorStats?.total_earned || 0)}</p><p className="mt-1 text-xs text-muted-foreground">Honor diterima</p></div>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="quick-actions-heading">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Navigasi</p><h2 id="quick-actions-heading" className="mt-1 text-lg font-bold">Akses cepat</h2></div></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.path} to={action.path} className="group relative flex min-h-[96px] flex-col justify-between rounded-xl border border-border/80 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {action.badge !== undefined && <span className="absolute right-3 top-3 inline-flex min-w-5 items-center justify-center rounded-full bg-warning px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground">{action.badge}</span>}
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.iconClass}`}><action.icon className="h-5 w-5" /></span>
                <span className="mt-3 flex items-center justify-between text-sm font-semibold">{action.label}<ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)] lg:items-start">
          <section aria-labelledby="upcoming-heading">
            <div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agenda</p><h2 id="upcoming-heading" className="mt-1 text-lg font-bold">Event mendatang</h2></div><Link to="/referee/events"><Button variant="ghost" size="sm" className="text-primary hover:text-primary">Lihat semua <ChevronRight className="ml-1 h-4 w-4" /></Button></Link></div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {eventsError ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">Data event belum dapat dimuat.</div>
                ) : upcomingEvents && upcomingEvents.length > 0 ? (
                  <div className="divide-y divide-border">
                    {upcomingEvents.slice(0, 4).map((assignment) => {
                      const assignmentStatus = getAssignmentStatus(assignment.status);
                      return (
                        <Link key={assignment.id} to="/referee/events" className="block p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:p-5">
                          <div className="flex items-start gap-4">
                            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex"><CalendarDays className="h-5 w-5" /></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{assignment.event?.name || "Event belum tersedia"}</h3><StatusBadge status={assignmentStatus.variant} className={assignmentStatus.className}>{assignmentStatus.label}</StatusBadge></div>
                              <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatEventDate(assignment.event?.start_date)}</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{assignment.event?.location || "Lokasi belum ditentukan"}</span></div>
                            </div>
                            <div className="hidden shrink-0 text-right sm:block"><p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Peran</p><p className="mt-1 text-sm font-bold text-primary">{assignment.role === "UTAMA" ? "Wasit 1" : "Cadangan"}</p></div>
                            <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center"><CalendarDays className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" /><p className="text-sm font-medium">Belum ada event mendatang</p><p className="mt-1 text-xs text-muted-foreground">Event yang sudah disetujui akan tampil di sini.</p></div>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="card-heading">
            <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Identitas resmi</p><h2 id="card-heading" className="mt-1 text-lg font-bold">Kartu wasit</h2></div>
            <Card className="overflow-hidden border-primary/20 bg-primary text-primary-foreground shadow-md">
              <CardContent className="p-5">
                {cardLoading ? (
                  <div className="space-y-3" role="status" aria-label="Memuat kartu wasit"><div className="h-5 w-28 animate-pulse rounded bg-primary-foreground/15" /><div className="h-8 w-44 animate-pulse rounded bg-primary-foreground/15" /><div className="h-4 w-full animate-pulse rounded bg-primary-foreground/15" /></div>
                ) : refereeCard ? (
                  <>
                    <div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-primary-foreground/60">AFP Sulsel Referee</p><p className="mt-3 text-xl font-bold">{refereeCard.card_number}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary-foreground/20 bg-primary-foreground/10"><ShieldCheck className="h-5 w-5" /></div></div>
                    <div className="mt-6 flex items-center justify-between border-t border-primary-foreground/15 pt-4"><div><p className="text-xs text-primary-foreground/60">Status kartu</p><p className="mt-1 text-sm font-semibold">{refereeCard.status === "active" ? "Aktif dan terverifikasi" : "Perlu perhatian"}</p></div><StatusBadge status={refereeCard.status === "active" ? "success" : "warning"} className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">{refereeCard.status === "active" ? "Aktif" : refereeCard.status}</StatusBadge></div>
                    <Link to="/referee/id-card" className="mt-5 block"><Button variant="outline" className="w-full border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">Buka ID Card <ArrowUpRight className="ml-2 h-4 w-4" /></Button></Link>
                  </>
                ) : (
                  <><p className="text-sm font-semibold">Kartu wasit belum tersedia</p><p className="mt-1 text-xs text-primary-foreground/70">Kartu akan muncul setelah profil Anda lengkap.</p><Link to="/referee/id-card" className="mt-5 block"><Button variant="outline" className="w-full border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">Lihat status kartu <ArrowUpRight className="ml-2 h-4 w-4" /></Button></Link></>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        {pendingAmount > 0 && (
          <Link to="/referee/honor" className="block">
            <Card className="border-warning/30 bg-warning/10 transition-colors hover:bg-warning/15"><CardContent className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/20 text-warning"><Clock className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Honor menunggu verifikasi</p><p className="mt-0.5 text-xs text-muted-foreground">{formatCurrency(pendingAmount)} dari {honorStats?.total_pending || pendingHonors.length} pengajuan</p></div></div><ArrowUpRight className="h-5 w-5 text-warning" /></CardContent></Card>
          </Link>
        )}

        <section aria-labelledby="honor-heading">
          <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Keuangan</p><h2 id="honor-heading" className="mt-1 text-lg font-bold">Riwayat honor</h2></div>
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-border px-4 pt-3 sm:px-5"><TabsList className="grid w-full max-w-sm grid-cols-2 bg-muted/60"><TabsTrigger value="active" className="min-h-[40px]">Menunggu ({pendingHonors.length})</TabsTrigger><TabsTrigger value="completed" className="min-h-[40px]">Selesai ({completedHonors.length})</TabsTrigger></TabsList></div>
                <TabsContent value="active" className="m-0 divide-y divide-border">
                  {pendingHonors.length === 0 ? <div className="p-8 text-center"><Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" /><p className="text-sm font-medium">Tidak ada honor menunggu</p><p className="mt-1 text-xs text-muted-foreground">Pengajuan honor Anda akan muncul di sini.</p></div> : pendingHonors.map((honor) => <div key={honor.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{honor.events?.name || "Event tidak ditemukan"}</h3>{getHonorStatusBadge(honor.status)}</div><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{formatEventDate(honor.events?.start_date)}</p></div><p className="shrink-0 text-sm font-bold text-warning">{formatCurrency(honor.amount)}</p></div>)}
                </TabsContent>
                <TabsContent value="completed" className="m-0 divide-y divide-border">
                  {completedHonors.length === 0 ? <div className="p-8 text-center"><CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" /><p className="text-sm font-medium">Belum ada honor terverifikasi</p><p className="mt-1 text-xs text-muted-foreground">Honor yang selesai diverifikasi akan muncul di sini.</p></div> : completedHonors.map((honor) => <div key={honor.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold">{honor.events?.name || "Event tidak ditemukan"}</h3>{getHonorStatusBadge(honor.status)}</div><p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{formatEventDate(honor.events?.start_date)}</p></div><p className="shrink-0 text-sm font-bold text-success">{formatCurrency(honor.amount)}</p></div>)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>
      </main>

      <RefereeNav />
    </div>
  );
}
