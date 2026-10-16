import { useState } from "react";
import { 
  Wallet, 
  Calendar, 
  MapPin, 
  AlertCircle, 
  Send, 
  Clock, 
  CheckCircle2, 
  FileCheck,
  Plus,
  X,
  Loader2,
  ArrowUpRight,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHonors, useCreateHonor, useUpdateHonor, useSubmitHonor, useHonorStatistics, Honor } from "@/hooks/useHonors";
import { useEligibleHonorEvents, useCheckHonorExists } from "@/hooks/useEligibleHonorEvents";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RefereeNav } from "@/components/layout/RefereeNav";

// Remove duplicate formatCurrency - now imported from formatters

const getStatusConfig = (status: Honor["status"]) => {
  switch (status) {
    case "draft":
      return { 
        label: "Draft", 
        variant: "neutral" as const,
        icon: Clock,
        color: "text-muted-foreground"
      };
    case "submitted":
      return { 
        label: "Menunggu Verifikasi", 
        variant: "warning" as const,
        icon: Send,
        color: "text-warning"
      };
    case "verified":
      return { 
        label: "Terverifikasi", 
        variant: "success" as const,
        icon: CheckCircle2,
        color: "text-success"
      };
    case "rejected":
      return { 
        label: "Ditolak", 
        variant: "error" as const,
        icon: X,
        color: "text-destructive"
      };
    default:
      return { 
        label: status, 
        variant: "neutral" as const,
        icon: Clock,
        color: "text-muted-foreground"
      };
  }
};

export default function RefereeHonor() {
  const [showInputForm, setShowInputForm] = useState(false);
  const [showSubmitDrawer, setShowSubmitDrawer] = useState(false);
  
  // Form state
  const [selectedEvent, setSelectedEvent] = useState("");
  const [honorAmount, setHonorAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Hooks
  const { data: honors, isLoading: honorsLoading } = useHonors();
  const { data: eligibleEvents, isLoading: eventsLoading } = useEligibleHonorEvents();
  const { data: honorExists } = useCheckHonorExists(selectedEvent || null);
  const { data: honorStats } = useHonorStatistics();
  const createHonor = useCreateHonor();
  const updateHonor = useUpdateHonor();
  const submitHonor = useSubmitHonor();

  const validateForm = (): boolean => {
    if (!selectedEvent) {
      setFormError("Pilih event terlebih dahulu");
      return false;
    }

    // Check for duplicate honor
    if (honorExists) {
      setFormError("Honor untuk event ini sudah pernah diajukan");
      return false;
    }
    
    const amount = parseInt(honorAmount.replace(/\D/g, ""));
    if (!amount || amount <= 0) {
      setFormError("Masukkan jumlah honor yang valid");
      return false;
    }
    
    if (amount > 10000000) {
      setFormError("Jumlah honor maksimal Rp 10.000.000");
      return false;
    }

    setFormError(null);
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateForm()) return;

    await createHonor.mutateAsync({
      event_id: selectedEvent,
      amount: parseInt(honorAmount.replace(/\D/g, "")),
      notes: notes.trim() || undefined,
      status: "draft",
    });

    resetForm();
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowSubmitDrawer(true);
  };

  const confirmSubmit = async () => {
    await createHonor.mutateAsync({
      event_id: selectedEvent,
      amount: parseInt(honorAmount.replace(/\D/g, "")),
      notes: notes.trim() || undefined,
      status: "submitted",
    });

    resetForm();
    setShowSubmitDrawer(false);
  };

  const resetForm = () => {
    setSelectedEvent("");
    setHonorAmount("");
    setNotes("");
    setFormError(null);
    setShowInputForm(false);
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    if (numericValue) {
      const formatted = new Intl.NumberFormat("id-ID").format(parseInt(numericValue));
      setHonorAmount(formatted);
    } else {
      setHonorAmount("");
    }
  };

  const submitDraft = async (entry: Honor) => {
    await submitHonor.mutateAsync({
      id: entry.id,
    });
  };

  if (honorsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label="Memuat data honor">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-primary/10 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/65">Keuangan perwasitan</p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Honor Wasit</h1>
              <p className="mt-1 text-sm text-primary-foreground/75">Ringkasan honorarium dan pengajuan Anda.</p>
            </div>
            {!showInputForm && (
              <Button onClick={() => setShowInputForm(true)} className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Input honor baru
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section aria-labelledby="honor-summary-heading">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ringkasan</p>
            <h2 id="honor-summary-heading" className="mt-1 text-lg font-bold">Status honorarium Anda</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="border-border/80 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-success" /> Terverifikasi</div>
                <p className="mt-3 text-xl font-bold text-success">{formatCurrency(honorStats?.total_earned || 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Honor dengan status verified</p>
              </CardContent>
            </Card>
            <Card className="border-border/80 shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4 text-warning" /> Menunggu</div>
                <p className="mt-3 text-xl font-bold text-warning">{formatCurrency(honorStats?.pending_amount || 0)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Honor yang diajukan dan menunggu verifikasi</p>
              </CardContent>
            </Card>
            <Card className="border-border/80 bg-primary/[0.03] shadow-none">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><FileText className="h-4 w-4 text-primary" /> Total pengajuan</div>
                <p className="mt-3 text-xl font-bold text-primary">{honors?.length || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Seluruh riwayat honor Anda</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {showInputForm ? (
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="border-b border-border/70 pb-4">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Pengajuan baru</p><CardTitle className="mt-1 text-lg">Input honor</CardTitle></div>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={resetForm} aria-label="Tutup form input honor"><X className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-5 sm:p-6">
              <Alert className="border-warning/30 bg-warning/10"><AlertCircle className="h-4 w-4 text-warning" /><AlertDescription className="text-sm text-warning">Honor akan diverifikasi oleh Admin sebelum diproses.</AlertDescription></Alert>
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="event">Event <span className="text-destructive">*</span></Label>
                  {eventsLoading ? <div className="h-12 animate-pulse rounded-md bg-muted" /> : eligibleEvents && eligibleEvents.length > 0 ? (
                    <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                      <SelectTrigger className="h-12"><SelectValue placeholder="Pilih event yang sudah selesai..." /></SelectTrigger>
                      <SelectContent>{eligibleEvents.map((event) => <SelectItem key={event.id} value={event.id}><div className="flex flex-col"><span>{event.name}</span><span className="text-xs text-muted-foreground">{format(new Date(event.start_date), "dd MMM yyyy", { locale: id })} · {event.location || "Lokasi belum ditentukan"}</span></div></SelectItem>)}</SelectContent>
                    </Select>
                  ) : <Alert className="border-border bg-muted/50"><AlertCircle className="h-4 w-4 text-muted-foreground" /><AlertDescription className="text-sm text-muted-foreground">Tidak ada event yang eligible untuk input honor. Event harus sudah selesai, Anda sudah dikonfirmasi, dan belum memiliki pengajuan honor.</AlertDescription></Alert>}
                </div>
                <div className="space-y-2"><Label htmlFor="amount">Jumlah Honor <span className="text-destructive">*</span></Label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">Rp</span><Input id="amount" type="text" inputMode="numeric" placeholder="0" value={honorAmount} onChange={(event) => handleAmountChange(event.target.value)} className="h-12 pl-10 text-right text-lg font-semibold" maxLength={15} /></div></div>
              </div>
              {selectedEvent && eligibleEvents && <div className="rounded-lg border border-border/70 bg-muted/30 p-4">{(() => { const event = eligibleEvents.find((item) => item.id === selectedEvent); return event ? <div className="space-y-2"><p className="font-semibold">{event.name}</p><div className="flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{format(new Date(event.start_date), "dd MMM yyyy", { locale: id })}</span><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{event.location || "Lokasi belum ditentukan"}</span></div><StatusBadge status="success">{event.role}</StatusBadge></div> : null; })()}</div>}
              <div className="space-y-2"><Label htmlFor="notes">Catatan</Label><Textarea id="notes" placeholder="Contoh: 3 pertandingan sebagai wasit utama..." value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={200} className="min-h-[96px]" /><p className="text-right text-xs text-muted-foreground">{notes.length}/200</p></div>
              {formError && <Alert variant="destructive" role="alert"><AlertCircle className="h-4 w-4" /><AlertDescription>{formError}</AlertDescription></Alert>}
              <div className="flex flex-col-reverse gap-3 border-t border-border/70 pt-5 sm:flex-row sm:justify-end"><Button variant="outline" className="h-11 sm:min-w-36" onClick={handleSaveDraft} disabled={createHonor.isPending || updateHonor.isPending}>{createHonor.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan draft"}</Button><Button className="h-11 sm:min-w-36" onClick={handleSubmit} disabled={createHonor.isPending || submitHonor.isPending}><Send className="mr-2 h-4 w-4" /> Ajukan</Button></div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed border-primary/25 bg-primary/[0.03] shadow-none">
            <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"><div><p className="text-sm font-semibold">Sudah menyelesaikan event?</p><p className="mt-1 text-sm text-muted-foreground">Ajukan honor dari event yang eligible untuk diproses Admin.</p></div><Button variant="outline" onClick={() => setShowInputForm(true)} className="w-full sm:w-auto"><Plus className="mr-2 h-4 w-4" /> Input honor</Button></CardContent>
          </Card>
        )}

        <section aria-labelledby="honor-history-heading">
          <div className="mb-3 flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Aktivitas</p><h2 id="honor-history-heading" className="mt-1 text-lg font-bold">Riwayat honor</h2></div><span className="text-xs text-muted-foreground">{honors?.length || 0} pengajuan</span></div>
          {!honors || honors.length === 0 ? <Card className="border-dashed"><CardContent className="p-10 text-center"><Wallet className="mx-auto mb-3 h-9 w-9 text-muted-foreground/40" /><p className="font-semibold">Belum ada data honor</p><p className="mt-1 text-sm text-muted-foreground">Informasi honorarium akan muncul setelah event dan proses terkait tersedia.</p></CardContent></Card> : <Card className="overflow-hidden"><CardContent className="p-0"><div className="divide-y divide-border">{honors.map((entry) => { const statusConfig = getStatusConfig(entry.status); const StatusIcon = statusConfig.icon; return <div key={entry.id} className="p-4 transition-colors hover:bg-muted/20 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-start gap-3"><div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${statusConfig.color}`}><StatusIcon className="h-4 w-4" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate font-semibold">{entry.events?.name || "Event tidak ditemukan"}</h3><StatusBadge status={entry.status === "verified" ? "success" : entry.status === "submitted" ? "warning" : entry.status === "rejected" ? "error" : "neutral"}>{statusConfig.label}</StatusBadge></div><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{entry.events?.start_date ? format(new Date(entry.events.start_date), "dd MMM yyyy", { locale: id }) : "Tanggal belum tersedia"}</span>{entry.notes && <span className="max-w-full truncate">{entry.notes}</span>}</div></div></div><div className="flex items-center justify-between gap-4 border-t border-border/70 pt-3 sm:min-w-44 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0"><p className={`text-lg font-bold ${statusConfig.color}`}>{formatCurrency(entry.amount)}</p>{entry.status === "draft" && <Button size="sm" onClick={() => submitDraft(entry)} disabled={updateHonor.isPending} className="min-h-[36px]"><Send className="mr-1 h-3 w-3" /> Ajukan</Button>}</div></div></div>; })}</div></CardContent></Card>}
        </section>
      </main>

      {/* Submit Confirmation Drawer (Mobile-optimized) */}
      <Drawer open={showSubmitDrawer} onOpenChange={setShowSubmitDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Konfirmasi Pengajuan</DrawerTitle>
            <DrawerDescription>
              Setelah diajukan, honor akan menunggu verifikasi dari admin. 
              Anda tidak dapat mengubah data setelah diajukan.
            </DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="pb-safe">
            <Button onClick={confirmSubmit} disabled={createHonor.isPending || submitHonor.isPending} className="h-12">
              {createHonor.isPending || submitHonor.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Ya, Ajukan
            </Button>
            <Button variant="outline" onClick={() => setShowSubmitDrawer(false)} className="h-12">
              Batal
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Bottom Navigation */}
      <RefereeNav />
    </div>
  );
}
