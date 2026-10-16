import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const EXPORTABLE_TABLES = [
  { id: 'profiles', name: 'Profil Pengguna', description: 'Data profil semua pengguna' },
  { id: 'events', name: 'Event', description: 'Data semua event futsal' },
  { id: 'event_assignments', name: 'Penugasan Wasit', description: 'Data penugasan wasit ke event' },
  { id: 'event_approvals', name: 'Persetujuan Event', description: 'Riwayat persetujuan event' },
  { id: 'honors', name: 'Honor', description: 'Data honor wasit' },
  { id: 'evaluations', name: 'Evaluasi', description: 'Data evaluasi wasit' },
  { id: 'evaluation_scores', name: 'Skor Evaluasi', description: 'Detail skor evaluasi' },
  { id: 'kabupaten_kota', name: 'Kabupaten/Kota', description: 'Data wilayah' },
  { id: 'user_roles', name: 'Role Pengguna', description: 'Data role pengguna' },
  { id: 'pengurus', name: 'Pengurus', description: 'Data pengurus organisasi' },
  { id: 'audit_logs', name: 'Audit Logs', description: 'Log aktivitas sistem' },
] as const;

export type ExportableTable = typeof EXPORTABLE_TABLES[number]['id'];
export type ExportFormat = 'json' | 'csv';

interface ExportResult {
  data: Record<string, unknown[]> | Record<string, string>;
  format: ExportFormat;
  errors?: string[];
  exported_at: string;
  exported_by: string;
}

export function useExportDatabase() {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const exportDatabase = async ({
    tables,
    format,
    startDate,
    endDate,
  }: {
    tables: ExportableTable[];
    format: ExportFormat;
    startDate?: string;
    endDate?: string;
  }): Promise<ExportResult | null> => {
    setIsExporting(true);
    setProgress("Memulai export...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesi tidak valid. Silakan login ulang.");
        return null;
      }

      setProgress(`Mengexport ${tables.length} tabel...`);

      const params = new URLSearchParams();
      params.append('tables', tables.join(','));
      params.append('format', format);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);

      const response = await supabase.functions.invoke('export-database', {
        body: null,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ExportResult;

      if (result.errors && result.errors.length > 0) {
        toast.warning(`Export selesai dengan ${result.errors.length} error`);
      } else {
        toast.success("Export database berhasil!");
      }

      setProgress("Export selesai!");
      return result;

    } catch (error) {
      console.error('Export error:', error);
      toast.error("Gagal export database: " + (error instanceof Error ? error.message : "Unknown error"));
      return null;
    } finally {
      setIsExporting(false);
      setProgress("");
    }
  };

  const downloadExport = (result: ExportResult, filename?: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = filename || `ffss-export-${timestamp}`;

    if (result.format === 'json') {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseFilename}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (result.format === 'csv') {
      // For CSV, download each table as separate file or combine
      const csvData = result.data as Record<string, string>;
      for (const [table, csv] of Object.entries(csvData)) {
        if (csv) {
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${baseFilename}-${table}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
    }
  };

  return {
    exportDatabase,
    downloadExport,
    isExporting,
    progress,
  };
}
