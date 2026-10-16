import { useMemo, useState } from "react";
import { Eye, KeyRound, Search, ShieldCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { AssignmentStatusBadge, assignmentStatusConfig } from "@/components/ui/assignment-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminEventAssignments, useAdminKabupatenKota, useChangeAdminAssignmentStatus } from "@/hooks/useAdminEventAssignments";
import type { AssignmentStatus, EventAssignment } from "@/hooks/useEventAssignments";
import { toast } from "sonner";

const statuses: AssignmentStatus[] = ["pending", "confirmed", "declined", "cancelled"];

function statusLabel(status: string | null) {
  if (status === "confirmed") return "Dikonfirmasi";
  if (status === "declined") return "Ditolak";
  if (status === "cancelled") return "Dibatalkan";
  return "Menunggu";
}

function regionLabel(assignment: EventAssignment) {
  return assignment.event?.kabupaten_kota?.name ?? "Belum ditentukan";
}

function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

export default function AdminEventAssignments() {
  const { isAdminProvinsi, profile } = useAuth();
  const { data = [], isLoading, isError } = useAdminEventAssignments();
  const { data: regions = [] } = useAdminKabupatenKota();
  const changeStatus = useChangeAdminAssignmentStatus();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [selected, setSelected] = useState<EventAssignment | null>(null);
  const [statusDialog, setStatusDialog] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [nextStatus, setNextStatus] = useState<AssignmentStatus>("confirmed");
  const [cancellationReason, setCancellationReason] = useState("");
  const [password, setPassword] = useState("");

  const filtered = useMemo(() => data.filter((assignment) => {
    const haystack = `${assignment.event?.name ?? ""} ${assignment.referee?.full_name ?? ""} ${regionLabel(assignment)}`.toLowerCase();
    const eventRegionId = assignment.event?.kabupaten_kota_id ?? "none";
    return haystack.includes(search.toLowerCase())
      && (statusFilter === "all" || assignment.status === statusFilter)
      && (regionFilter === "all" || eventRegionId === regionFilter);
  }), [data, search, statusFilter, regionFilter]);

  const openStatus = (assignment: EventAssignment) => {
    if (!isAdminProvinsi()) {
      toast.error("Anda tidak memiliki kewenangan Admin Provinsi untuk melakukan tindakan ini.");
      return;
    }
    setSelected(assignment);
    setNextStatus(assignment.status === "pending" ? "confirmed" : assignment.status === "confirmed" ? "cancelled" : assignment.status === "declined" ? "confirmed" : "pending");
    setCancellationReason("");
    setStatusDialog(true);
  };

  const submitStatus = async () => {
    if (!selected) return;
    if (nextStatus === "cancelled" && !cancellationReason.trim()) {
      toast.error("Alasan pembatalan wajib diisi saat status diubah menjadi cancelled.");
      return;
    }
    setPasswordDialog(true);
    setStatusDialog(false);
  };

  const verifyAndChange = async () => {
    if (!selected || !password) return;
    try {
      await changeStatus.mutateAsync({
        assignmentId: selected.id,
        nextStatus,
        password,
        reason: nextStatus === "cancelled" ? cancellationReason.trim() : undefined,
      });
      toast.success(`Status berhasil diperbarui: ${statusLabel(selected.status)} -> ${statusLabel(nextStatus)}`);
      setPassword("");
      setCancellationReason("");
      setPasswordDialog(false);
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status assignment gagal diperbarui.");
    }
  };

  return (
    <AppLayout title="Event Assignment Management">
      <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Event Assignment Management</h1>
            <p className="text-sm text-muted-foreground">Kelola penugasan wasit dan status assignment kegiatan.</p>
          </div>
          <Badge className="w-fit gap-2"><ShieldCheck className="h-3.5 w-3.5" /> ADMIN PROVINSI</Badge>
        </div>

        <Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="Cari event atau referee..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Semua status</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}><div className="flex items-center gap-2"><AssignmentStatusBadge status={status} className="shrink-0" />{statusLabel(status)}</div></SelectItem>)}</SelectContent></Select>
          <Select value={regionFilter} onValueChange={setRegionFilter}><SelectTrigger className="w-full md:w-56"><SelectValue placeholder="Daerah" /></SelectTrigger><SelectContent><SelectItem value="all">Semua Daerah</SelectItem>{regions.map((region) => <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>)}</SelectContent></Select>
        </CardContent></Card>

        {isLoading ? <Card><CardContent className="p-8 text-center text-muted-foreground">Memuat event assignment...</CardContent></Card> : isError ? <Card><CardContent className="p-8 text-center text-destructive">Data event assignment tidak dapat dimuat.</CardContent></Card> : filtered.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">Belum ada event assignment yang tersedia.</CardContent></Card> : <>
          <div className="hidden overflow-hidden rounded-lg border bg-card md:block"><table className="w-full text-sm"><thead className="border-b bg-muted/40 text-left"><tr><th className="p-3">Event</th><th className="p-3">Daerah</th><th className="p-3">Tanggal</th><th className="p-3">Lokasi</th><th className="p-3">Wasit</th><th className="p-3">Status</th><th className="p-3 text-right">Aksi</th></tr></thead><tbody>{filtered.map((assignment) => <tr key={assignment.id} className="border-b last:border-0"><td className="p-3 font-medium">{assignment.event?.name ?? "-"}</td><td className="p-3">{regionLabel(assignment)}</td><td className="p-3">{formatDate(assignment.event?.start_date)}</td><td className="p-3">{assignment.event?.location ?? "-"}</td><td className="p-3">{assignment.referee?.full_name ?? "-"}</td><td className="p-3"><AssignmentStatusBadge status={assignment.status} /></td><td className="p-3"><div className="flex justify-end gap-2"><Button size="sm" variant="ghost" onClick={() => setSelected(assignment)}><Eye className="mr-1 h-4 w-4" />Detail</Button><Button size="sm" onClick={() => openStatus(assignment)}>Ubah Status</Button></div></td></tr>)}</tbody></table></div>
          <div className="grid gap-3 md:hidden">{filtered.map((assignment) => <Card key={assignment.id} className="min-w-0"><CardContent className="space-y-3 p-4"><div className="flex min-w-0 items-start justify-between gap-3"><div className="min-w-0"><h2 className="break-words font-semibold">{assignment.event?.name ?? "-"}</h2><p className="text-sm text-muted-foreground">Wasit: {assignment.referee?.full_name ?? "-"}</p></div><AssignmentStatusBadge status={assignment.status} className="shrink-0" /></div><p className="text-sm text-muted-foreground">Daerah: {regionLabel(assignment)}</p><p className="text-sm text-muted-foreground">Tanggal: {formatDate(assignment.event?.start_date)} - {assignment.event?.location ?? "-"}</p><div className="flex min-w-0 gap-2"><Button className="min-w-0 flex-1" variant="outline" onClick={() => setSelected(assignment)}>Detail</Button><Button className="min-w-0 flex-1" onClick={() => openStatus(assignment)}>Ubah Status</Button></div></CardContent></Card>)}</div>
        </>}
      </div>

      <Dialog open={Boolean(selected) && !statusDialog && !passwordDialog} onOpenChange={(open) => !open && setSelected(null)}><DialogContent><DialogHeader><DialogTitle>Detail Event Assignment</DialogTitle><DialogDescription>Informasi assignment dari data canonical.</DialogDescription></DialogHeader>{selected && <div className="space-y-3 text-sm"><div><Label>Event</Label><p>{selected.event?.name ?? "-"}</p></div><div><Label>Daerah</Label><p>{regionLabel(selected)}</p></div><div><Label>Lokasi</Label><p>{selected.event?.location ?? "-"}</p></div><div><Label>Wasit</Label><p>{selected.referee?.full_name ?? "-"}</p></div><div><Label>Tanggal</Label><p>{formatDate(selected.event?.start_date)}</p></div><div><Label>Status</Label><div className="mt-1"><AssignmentStatusBadge status={selected.status} /></div></div><div><Label>Dibuat</Label><p>{formatDate(selected.created_at)}</p></div><div><Label>Terakhir diperbarui</Label><p>{formatDate(selected.updated_at)}</p></div></div>}<DialogFooter><Button variant="outline" onClick={() => setSelected(null)}>Tutup</Button><Button onClick={() => selected && openStatus(selected)}>Ubah Status</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={statusDialog} onOpenChange={setStatusDialog}><DialogContent><DialogHeader><DialogTitle>Ubah Status Assignment</DialogTitle><DialogDescription>Admin dapat mengubah assignment ke salah satu status canonical yang tersedia.</DialogDescription></DialogHeader>{selected && <div className="space-y-4"><div className="space-y-1 text-sm"><p><strong>Event:</strong> {selected.event?.name}</p><p><strong>Daerah:</strong> {regionLabel(selected)}</p><p><strong>Wasit:</strong> {selected.referee?.full_name}</p></div><div className="space-y-2"><Label>Status baru</Label><Select value={nextStatus} onValueChange={(value) => setNextStatus(value as AssignmentStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}><div className="flex items-center gap-2"><AssignmentStatusBadge status={status} className="shrink-0" />{statusLabel(status)}</div></SelectItem>)}</SelectContent></Select></div>{nextStatus === "cancelled" && <div className="space-y-2"><Label htmlFor="cancellation-reason">Cancellation Reason</Label><Input id="cancellation-reason" value={cancellationReason} onChange={(event) => setCancellationReason(event.target.value)} placeholder="Masukkan alasan pembatalan" /></div>}<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center"><AssignmentStatusBadge status={selected.status} /><span>-&gt;</span><AssignmentStatusBadge status={nextStatus} /></div></div>}<DialogFooter><Button variant="outline" onClick={() => { setStatusDialog(false); setCancellationReason(""); }}>Batal</Button><Button onClick={submitStatus}>Lanjutkan</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={passwordDialog} onOpenChange={(open) => { if (!open && !changeStatus.isPending) { setPassword(""); setPasswordDialog(false); } }}><DialogContent><form onSubmit={(event) => { event.preventDefault(); void verifyAndChange(); }}><DialogHeader><DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Verifikasi Admin</DialogTitle><DialogDescription>Masukkan password akun Anda untuk memverifikasi ulang tindakan Admin Provinsi. Password tidak disimpan.</DialogDescription></DialogHeader>{selected && <div className="space-y-4"><div className="rounded-md bg-muted p-3 text-sm"><p>Admin: {profile?.full_name || "Admin Provinsi terautentikasi"}</p><p>{selected.event?.name} - {regionLabel(selected)} - {selected.referee?.full_name}</p><p className="mt-2 font-semibold">{statusLabel(selected.status)} -&gt; {statusLabel(nextStatus)}</p></div><div className="space-y-2"><Label htmlFor="admin-step-up-password">Password</Label><Input id="admin-step-up-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div></div>}<DialogFooter><Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => { setPassword(""); setPasswordDialog(false); }}>Batal</Button><Button type="submit" disabled={!password || changeStatus.isPending}>{changeStatus.isPending ? "Memverifikasi..." : "Verifikasi & Lanjutkan"}</Button></DialogFooter></form></DialogContent></Dialog>
    </AppLayout>
  );
}