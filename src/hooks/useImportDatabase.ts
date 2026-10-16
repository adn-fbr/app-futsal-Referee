import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EXPORTABLE_TABLES, ExportableTable } from "./useExportDatabase";

export type ConflictStrategy = 'skip' | 'update';

interface ImportResult {
  table: string;
  success: number;
  failed: number;
  errors: string[];
}

interface ImportResponse {
  success: boolean;
  results: ImportResult[];
  summary: {
    total_success: number;
    total_failed: number;
  };
  imported_at: string;
  imported_by: string;
}

// Tables that can be imported (exclude audit_logs as it's read-only)
export const IMPORTABLE_TABLES = EXPORTABLE_TABLES.filter(t => t.id !== 'audit_logs');

function parseCSV(csvContent: string): Record<string, unknown>[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, unknown> = {};
    
    headers.forEach((header, index) => {
      let value: unknown = values[index] || null;
      
      if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string
        }
      }
      
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      if (value === 'null' || value === '') value = null;
      
      row[header] = value;
    });
    
    rows.push(row);
  }

  return rows;
}

export function useImportDatabase() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const parseFile = async (file: File): Promise<{ table: string; records: Record<string, unknown>[] }[] | null> => {
    const content = await file.text();
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.json')) {
        const jsonData = JSON.parse(content);
        
        // Handle export format (object with table names as keys)
        if (typeof jsonData === 'object' && !Array.isArray(jsonData)) {
          return Object.entries(jsonData).map(([table, records]) => ({
            table,
            records: Array.isArray(records) ? records as Record<string, unknown>[] : [],
          }));
        }
        
        toast.error("Format JSON tidak valid. Gunakan file hasil export.");
        return null;
      } else if (fileName.endsWith('.csv')) {
        // Extract table name from filename (e.g., "ffss-export-2026-01-05-profiles.csv")
        const tableMatch = fileName.match(/-([a-z_]+)\.csv$/);
        const tableName = tableMatch ? tableMatch[1] : null;
        
        if (!tableName) {
          toast.error("Nama file CSV tidak valid. Gunakan file hasil export.");
          return null;
        }
        
        const records = parseCSV(content);
        return [{ table: tableName, records }];
      }
      
      toast.error("Format file tidak didukung. Gunakan JSON atau CSV.");
      return null;
    } catch (error) {
      console.error("Parse error:", error);
      toast.error("Gagal membaca file: " + (error instanceof Error ? error.message : "Unknown error"));
      return null;
    }
  };

  const importDatabase = async ({
    files,
    conflictStrategy,
  }: {
    files: File[];
    conflictStrategy: ConflictStrategy;
  }): Promise<ImportResponse | null> => {
    setIsImporting(true);
    setProgress("Membaca file...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesi tidak valid. Silakan login ulang.");
        return null;
      }

      // Parse all files
      const allData: { table: string; records: Record<string, unknown>[] }[] = [];
      
      for (const file of files) {
        setProgress(`Membaca ${file.name}...`);
        const parsed = await parseFile(file);
        if (parsed) {
          allData.push(...parsed);
        }
      }

      if (allData.length === 0) {
        toast.error("Tidak ada data valid untuk diimport.");
        return null;
      }

      // Filter out tables that shouldn't be imported
      const validTableIds = IMPORTABLE_TABLES.map(t => t.id);
      const filteredData = allData.filter(d => validTableIds.includes(d.table as typeof validTableIds[number]));
      
      if (filteredData.length === 0) {
        toast.error("Tidak ada tabel valid untuk diimport.");
        return null;
      }

      const totalRecords = filteredData.reduce((sum, d) => sum + d.records.length, 0);
      setProgress(`Mengimport ${totalRecords} record ke ${filteredData.length} tabel...`);

      const response = await supabase.functions.invoke('import-database', {
        body: {
          data: filteredData,
          format: 'json',
          conflictStrategy,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data as ImportResponse;

      if (result.summary.total_failed > 0) {
        toast.warning(`Import selesai: ${result.summary.total_success} berhasil, ${result.summary.total_failed} gagal`);
      } else {
        toast.success(`Import berhasil! ${result.summary.total_success} record diimport.`);
      }

      setProgress("Import selesai!");
      return result;

    } catch (error) {
      console.error('Import error:', error);
      toast.error("Gagal import database: " + (error instanceof Error ? error.message : "Unknown error"));
      return null;
    } finally {
      setIsImporting(false);
      setProgress("");
    }
  };

  return {
    importDatabase,
    parseFile,
    isImporting,
    progress,
  };
}
