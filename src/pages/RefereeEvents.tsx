import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
  Wallet,
  User,
  Loader2,
  Calendar,
  Trophy,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  useUpcomingRefereeEvents, 
  usePastRefereeEvents, 
  usePendingAssignments,
  RefereeEventAssignment 
} from "@/hooks/useRefereeEvents";
import { useConfirmAssignment } from "@/hooks/useEventAssignments";
import { formatEventDateRangeFull } from "@/lib/dateUtils";

const getRoleBadgeVariant = (role: string) => {
  return role === "UTAMA" ? "primary" : "info";
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Menunggu Konfirmasi";
    case "confirmed":
      return "Dikonfirmasi";
    case "declined":
      return "Ditolak";
    case "cancelled":
      return "Dibatalkan Admin";
    default:
      return status;
  }
};

const getHonorStatusLabel = (status: string | undefined) => {
  if (!status) return null;
  switch (status) {
    case "draft":
      return { label: "Honor: Draft", variant: "neutral" as const };
    case "submitted":
      return { label: "Honor: Menunggu", variant: "warning" as const };
    case "verified":
      return { label: "Honor: Terverifikasi", variant: "success" as const };
    case "rejected":
      return { label: "Honor: Ditolak", variant: "error" as const };
    default:
      return null;
  }
};

export default function RefereeEvents() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    assignment: RefereeEventAssignment | null;
    action: "confirm" | "decline";
  }>({ open: false, assignment: null, action: "confirm" });

  const { data: upcomingEvents, isLoading: upcomingLoading, error: upcomingError, refetch: refetchUpcoming } = useUpcomingRefereeEvents();
  const { data: pastEvents, isLoading: pastLoading, error: pastError, refetch: refetchPast } = usePastRefereeEvents();
  const { data: pendingAssignments, error: pendingError, refetch: refetchPending } = usePendingAssignments();
  const confirmAssignment = useConfirmAssignment();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/referee" },
    { icon: CalendarDays, label: "Event", path: "/referee/events" },
    { icon: Wallet, label: "Honor", path: "/referee/honor" },
    { icon: User, label: "Profil", path: "/referee/profile" },
  ];

  const handleConfirmAction = async () => {
    if (!confirmDialog.assignment) return;

    await confirmAssignment.mutateAsync({
      assignmentId: confirmDialog.assignment.id,
      confirm: confirmDialog.action === "confirm",
    });

    setConfirmDialog({ open: false, assignment: null, action: "confirm" });
  };

  const openConfirmDialog = (assignment: RefereeEventAssignment, action: "confirm" | "decline") => {
    setConfirmDialog({ open: true, assignment, action });
  };

  const isLoading = upcomingLoading || pastLoading;
  const refereeEventsError = upcomingError || pastError || pendingError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (refereeEventsError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" role="alert">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Event gagal dimuat</h2>
          <p className="text-sm text-muted-foreground mb-4">Data penugasan Anda tidak dapat dimuat. Silakan coba lagi.</p>
          <Button onClick={() => void Promise.all([refetchUpcoming(), refetchPast(), refetchPending()])}>Coba lagi</Button>
        </div>
      </div>
    );
  }

  const EventCard = ({ assignment, showActions = false }: { assignment: RefereeEventAssignment; showActions?: boolean }) => {
    const event = assignment.event;
    if (!event) return null;

    const isPastEvent = new Date(event.end_date) < new Date() || event.status === "SELESAI";
    const honorStatus = getHonorStatusLabel(assignment.honor?.status);
    const needsHonorSubmission = isPastEvent && !assignment.honor && assignment.status === "confirmed";

    return (
      <Card className="overflow-hidden border-border/80 shadow-none transition-shadow hover:shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{event.category || "Futsal"}</p>
              <h3 className="mt-1 truncate text-lg font-bold tracking-tight">{event.name}</h3>
            </div>
            <StatusBadge status={getRoleBadgeVariant(assignment.role)}>
              {assignment.role === "UTAMA" ? "Wasit 1" : "Cadangan"}
            </StatusBadge>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{formatEventDateRangeFull(event)}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{event.location || event.kabupaten_kota?.name || "Lokasi belum ditentukan"}</span>
            </div>
          </div>

          {/* Status indicators */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border/70 pt-4">
            {assignment.status === "pending" && (
              <StatusBadge status="warning">
                <Clock className="h-3 w-3 mr-1" />
                {getStatusLabel(assignment.status)}
              </StatusBadge>
            )}
            {assignment.status === "confirmed" && (
              <StatusBadge status="success">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {getStatusLabel(assignment.status)}
              </StatusBadge>
            )}
            {assignment.status === "declined" && (
              <StatusBadge status="error">
                <XCircle className="h-3 w-3 mr-1" />
                {getStatusLabel(assignment.status)}
              </StatusBadge>
            )}
            {assignment.status === "cancelled" && (
              <StatusBadge status="error">
                <XCircle className="h-3 w-3 mr-1" />
                {getStatusLabel(assignment.status)}
              </StatusBadge>
            )}
            {honorStatus && (
              <StatusBadge status={honorStatus.variant}>
                {honorStatus.label}
              </StatusBadge>
            )}
          </div>

          {/* Cancellation reason */}
          {assignment.status === "cancelled" && assignment.cancellation_reason && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3">
              <p className="text-xs text-destructive">
                <strong>Alasan pembatalan:</strong> {assignment.cancellation_reason}
              </p>
            </div>
          )}

          {/* Actions */}
          {showActions && assignment.status === "pending" && (
            <div className="mt-5 flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row">
              <Button 
                variant="outline" 
                size="sm" 
                className="min-h-11 flex-1"
                onClick={() => openConfirmDialog(assignment, "decline")}
              >
                <XCircle className="h-4 w-4 mr-1" />
                Tolak
              </Button>
              <Button 
                size="sm" 
                className="min-h-11 flex-1"
                onClick={() => openConfirmDialog(assignment, "confirm")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Konfirmasi
              </Button>
            </div>
          )}

          {/* Submit Honor Button for completed events */}
          {needsHonorSubmission && (
            <div className="mt-5 border-t pt-4">
              <Button 
                size="sm" 
                className="h-11 w-full sm:w-auto"
                onClick={() => navigate("/referee/honor")}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Honor
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="border-b border-primary/10 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">Operasional perwasitan</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Event Saya</h1>
          <p className="mt-1 text-sm text-primary-foreground/75">Jadwal dan penugasan event Anda.</p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section aria-label="Ringkasan event" className="grid gap-3 sm:grid-cols-3">
          <Card className="border-border/80 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Menunggu aksi</p><p className="mt-2 text-2xl font-bold text-warning">{pendingAssignments?.length || 0}</p><p className="mt-1 text-xs text-muted-foreground">Penugasan perlu konfirmasi</p></CardContent></Card>
          <Card className="border-border/80 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Akan datang</p><p className="mt-2 text-2xl font-bold text-primary">{upcomingEvents?.length || 0}</p><p className="mt-1 text-xs text-muted-foreground">Event yang sudah disetujui</p></CardContent></Card>
          <Card className="border-border/80 shadow-none"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Riwayat</p><p className="mt-2 text-2xl font-bold">{pastEvents?.length || 0}</p><p className="mt-1 text-xs text-muted-foreground">Event selesai atau terdahulu</p></CardContent></Card>
        </section>

        <section aria-labelledby="event-list-heading">
          <div className="mb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Agenda</p><h2 id="event-list-heading" className="mt-1 text-lg font-bold">Penugasan event</h2></div>
        {/* Pending Assignment Alert */}
        {pendingAssignments && pendingAssignments.length > 0 && (
          <Alert className="mb-4 border-warning/30 bg-warning/10">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm text-warning">
              Anda memiliki {pendingAssignments.length} penugasan yang menunggu konfirmasi
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid h-auto w-full max-w-xl grid-cols-2 bg-muted/60 p-1">
            <TabsTrigger value="upcoming" className="gap-1">
              <CalendarDays className="h-4 w-4" />
              Akan Datang ({upcomingEvents?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <Trophy className="h-4 w-4" />
              Riwayat ({pastEvents?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4 space-y-4">
            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  <CalendarDays className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
                  <p className="font-semibold">Belum ada event mendatang</p>
                  <p className="mt-1 text-sm">Event yang ditugaskan akan muncul di sini.</p>
                </CardContent>
              </Card>
            ) : (
              upcomingEvents.map((assignment) => (
                <EventCard key={assignment.id} assignment={assignment} showActions />
              ))
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            {!pastEvents || pastEvents.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  <Trophy className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" />
                  <p className="font-semibold">Belum ada riwayat event</p>
                  <p className="mt-1 text-sm">Event yang telah selesai akan muncul di sini.</p>
                </CardContent>
              </Card>
            ) : (
              pastEvents.map((assignment) => (
                <EventCard key={assignment.id} assignment={assignment} />
              ))
            )}
          </TabsContent>
        </Tabs>
        </section>
      </main>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmDialog.action === "confirm" ? "Konfirmasi Penugasan" : "Tolak Penugasan"}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.action === "confirm" 
                ? `Anda akan mengkonfirmasi kehadiran untuk event "${confirmDialog.assignment?.event?.name}". Pastikan Anda dapat hadir pada tanggal yang ditentukan.`
                : `Anda akan menolak penugasan untuk event "${confirmDialog.assignment?.event?.name}". Admin akan mencari wasit pengganti.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
            >
              Batal
            </Button>
            <Button 
              variant={confirmDialog.action === "confirm" ? "default" : "destructive"}
              onClick={handleConfirmAction}
              disabled={confirmAssignment.isPending}
            >
              {confirmAssignment.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {confirmDialog.action === "confirm" ? "Ya, Konfirmasi" : "Ya, Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
        <div className="grid grid-cols-4 h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
