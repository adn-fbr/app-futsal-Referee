import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { QrCode, Printer, RefreshCw, ShieldCheck, FileText } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentYear } from "@/contexts/CurrentYearContext";
import { useAnnualReport } from "@/hooks/useAnnualReport";
import { useIssueOfficialDocument } from "@/hooks/useOfficialDocument";
import { getAvailableReportYears } from "@/lib/annualReporting";
import { getAnnualDocumentNumber, groupEventsByMonth, summarizeAnnualReport } from "@/lib/annualReport";
import { formatCurrency } from "@/hooks/useReports";

const statusColors = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626"];

function statusLabel(status: string | null) {
  return status === "DISETUJUI" ? "Disetujui" : status === "SELESAI" ? "Selesai" : status === "DITOLAK" ? "Ditolak" : status ?? "-";
}

export default function AnnualReports() {
  const { currentYear } = useCurrentYear();
  const { isAdminProvinsi, kabupatenKotaId, profile, user } = useAuth();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [issuedDocument, setIssuedDocument] = useState<any | null>(null);
  const report = useAnnualReport(selectedYear, isAdminProvinsi() ? null : kabupatenKotaId);
  const issueDocument = useIssueOfficialDocument();
  const data = report.data;

  useEffect(() => setSelectedYear(currentYear), [currentYear]);

  const summary = useMemo(
    () => summarizeAnnualReport(data?.events ?? [], data?.assignments ?? [], data?.refereeIds ?? []),
    [data],
  );
  const monthlyData = useMemo(
    () => Object.entries(groupEventsByMonth(data?.events ?? [])).map(([month, total]) => ({ month: month.slice(5), total })),
    [data?.events],
  );
  const statusData = [
    { name: "Diajukan", value: summary.pendingEvents },
    { name: "Disetujui", value: summary.approvedEvents },
    { name: "Selesai", value: summary.completedEvents },
    { name: "Ditolak", value: Math.max(summary.totalEvents - summary.pendingEvents - summary.approvedEvents - summary.completedEvents, 0) },
  ];
  const documentNumber = getAnnualDocumentNumber(selectedYear, 1, isAdminProvinsi());
  const organization = isAdminProvinsi() ? "Asosiasi Futsal Provinsi Sulawesi Selatan" : `Asosiasi Futsal Kabupaten/Kota ${profile?.kabupaten_kota_id ?? ""}`;
  const totalHonor = (data?.honors ?? []).reduce((total, honor) => total + Number(honor.amount ?? 0), 0);

  const handleIssueDocument = async () => {
    if (!user?.id) return;

    const snapshot = {
      document_type: "annual_report",
      year: selectedYear,
      organization,
      summary: {
        total_events: summary.totalEvents,
        completed_events: summary.completedEvents,
        pending_events: summary.pendingEvents,
        approved_events: summary.approvedEvents,
        total_assignments: summary.totalAssignments,
        total_honor: totalHonor,
      },
      events: data?.events ?? [],
      assignments: data?.assignments ?? [],
    };

    const result = await issueDocument.mutateAsync({
      documentType: "annual_report",
      sourceEntityType: "annual_report",
      sourceEntityId: user.id,
      snapshot,
      issuedBy: user.id,
    });

    setIssuedDocument(result);
  };

  return (
    <AppLayout title="Laporan Tahunan">
      <div className="annual-report-page mx-auto w-full max-w-7xl space-y-5 p-4 pb-28 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between print:hidden">
          <div>
            <p className="text-sm font-medium text-primary">Pelaporan resmi</p>
            <h1 className="text-2xl font-bold tracking-tight">Laporan Tahunan</h1>
            <p className="text-sm text-muted-foreground">Ringkasan data aktual sesuai scope akun dan periode WITA.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>{getAvailableReportYears(currentYear).map((year) => <SelectItem key={year} value={String(year)}>{year}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void report.refetch()} disabled={report.isFetching}><RefreshCw className="mr-2 h-4 w-4" />Muat ulang</Button>
            <Button onClick={() => window.print()} disabled={!data}><Printer className="mr-2 h-4 w-4" />Cetak / PDF</Button>
          </div>
        </div>

        <section className="report-print-surface space-y-6">
          <header className="border-b-2 border-primary pb-4">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">AFP / AFK SULAWESI SELATAN</p><h2 className="mt-2 text-3xl font-bold">LAPORAN TAHUNAN</h2><p className="text-lg font-medium">{organization}</p><p className="text-sm text-muted-foreground">Periode 1 Januari {selectedYear} - 31 Desember {selectedYear} (WITA)</p></div>
              <div className="hidden text-right text-xs text-muted-foreground sm:block"><p>Nomor dokumen</p><p className="font-semibold text-foreground">{documentNumber}</p><p>Dibuat {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date())}</p></div>
            </div>
          </header>

          {report.isLoading && <Card><CardContent className="p-8 text-center text-muted-foreground">Memuat data laporan...</CardContent></Card>}
          {report.isError && <Card><CardContent className="p-8 text-center text-destructive">Data laporan tidak dapat dimuat oleh scope akun ini.</CardContent></Card>}
          {data && <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 print:grid-cols-4">
              {[['Total Event', summary.totalEvents], ['Event Selesai', summary.completedEvents], ['Event Pending', summary.pendingEvents], ['Total Penugasan', summary.totalAssignments], ['Total Wasit', data.refereeIds.length], ['Wasit Ditugaskan', summary.assignedReferees], ['Wasit Belum Ditugaskan', summary.unassignedReferees], ['Total Honor', formatCurrency(totalHonor)]].map(([label, value]) => <Card key={String(label)}><CardContent className="p-4"><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></CardContent></Card>)}
            </div>

            <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
              <Card><CardHeader><CardTitle className="text-base">Event per Bulan</CardTitle></CardHeader><CardContent><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="total" fill="#2563eb" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
              <Card><CardHeader><CardTitle className="text-base">Status Event</CardTitle></CardHeader><CardContent><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" outerRadius={78} label>{statusData.map((entry, index) => <Cell key={entry.name} fill={statusColors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent></Card>
            </div>

            <Card><CardHeader><CardTitle>Rekap Kegiatan</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Tanggal</TableHead><TableHead>Wilayah</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.events.map((event) => <TableRow key={event.id}><TableCell className="font-medium">{event.name}</TableCell><TableCell>{event.start_date ?? event.date}</TableCell><TableCell>{event.regionName ?? "Belum ditentukan"}</TableCell><TableCell><Badge variant="outline">{statusLabel(event.status)}</Badge></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Rekap Penugasan Wasit</CardTitle></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Wilayah</TableHead><TableHead>Wasit</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{data.assignments.map((assignment) => <TableRow key={assignment.id}><TableCell>{assignment.event?.name ?? "-"}</TableCell><TableCell>{assignment.event?.kabupaten_kota?.name ?? "Belum ditentukan"}</TableCell><TableCell>{assignment.referee?.full_name ?? "-"}</TableCell><TableCell>{assignment.status ?? "-"}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
            <Card><CardHeader><CardTitle>Honor dan Aktivitas</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><p className="text-sm text-muted-foreground">Total honor tercatat</p><p className="text-2xl font-bold">{data.honors.length ? formatCurrency(totalHonor) : "Data honor/pemasukan belum tersedia pada sumber data aplikasi."}</p></div><div><p className="text-sm text-muted-foreground">Aktivitas aplikasi tercatat</p><p className="text-2xl font-bold">{data.activities.length}</p></div></CardContent></Card>
          </>}
        </section>

        <Card className="border-amber-200 bg-amber-50/60 print:hidden"><CardContent className="flex gap-3 p-4"><ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" /><div className="w-full"><p className="font-semibold">Preview vs Official Document</p><p className="text-sm text-muted-foreground">Laporan ini masih merupakan preview sampai proses issuance database berhasil dibuat. Setelah issuance, dokumen resmi memperoleh nomor, hash integritas, dan QR validation publik.</p><div className="mt-3 flex flex-wrap gap-2"><Button variant="outline" onClick={() => void handleIssueDocument()} disabled={!data || issueDocument.isPending}><QrCode className="mr-2 h-4 w-4" />{issueDocument.isPending ? "Menerbitkan..." : "Terbitkan & QR"}</Button><Button variant="ghost" disabled><FileText className="mr-2 h-4 w-4" />Riwayat laporan</Button></div>{issuedDocument && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Official Document</p><p className="mt-1 text-lg font-bold text-emerald-900">{issuedDocument.document_number ?? "APSSI-..."}</p><p className="text-sm text-emerald-800">Status: {issuedDocument.status ?? "issued"}</p></div><div className="rounded-md bg-white p-2 shadow-sm"><QRCodeSVG value={`${window.location.origin}/verify/${issuedDocument.verification_token ?? ""}`} size={110} includeMargin /></div></div><p className="mt-3 break-all text-xs text-emerald-800">Validasi publik: {window.location.origin}/verify/{issuedDocument.verification_token}</p></div>}</div></CardContent></Card>
      </div>
    </AppLayout>
  );
}