import { useState, useRef } from "react";
import { Download, Database, Calendar, FileJson, FileSpreadsheet, Loader2, CheckCircle2, ArrowLeft, Upload, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExportDatabase, EXPORTABLE_TABLES, ExportableTable, ExportFormat } from "@/hooks/useExportDatabase";
import { useImportDatabase, IMPORTABLE_TABLES, ConflictStrategy } from "@/hooks/useImportDatabase";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function DatabaseExport() {
  const { isAdminProvinsi } = useAuth();
  const { exportDatabase, downloadExport, isExporting, progress: exportProgress } = useExportDatabase();
  const { importDatabase, isImporting, progress: importProgress } = useImportDatabase();

  // Export state
  const [selectedTables, setSelectedTables] = useState<ExportableTable[]>([]);
  const [format, setFormat] = useState<ExportFormat>('json');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastExportResult, setLastExportResult] = useState<{
    data: Record<string, unknown[]> | Record<string, string>;
    format: ExportFormat;
    errors?: string[];
    exported_at: string;
    exported_by: string;
  } | null>(null);

  // Import state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip');
  const [lastImportResult, setLastImportResult] = useState<{
    results: { table: string; success: number; failed: number; errors: string[] }[];
    summary: { total_success: number; total_failed: number };
    imported_at: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Only admin_provinsi can access this page
  if (!isAdminProvinsi()) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTables(EXPORTABLE_TABLES.map(t => t.id));
    } else {
      setSelectedTables([]);
    }
  };

  const handleTableToggle = (tableId: ExportableTable, checked: boolean) => {
    if (checked) {
      setSelectedTables(prev => [...prev, tableId]);
    } else {
      setSelectedTables(prev => prev.filter(t => t !== tableId));
    }
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      return;
    }

    const result = await exportDatabase({
      tables: selectedTables,
      format,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (result) {
      setLastExportResult(result);
    }
  };

  const handleDownload = () => {
    if (lastExportResult) {
      downloadExport(lastExportResult);
    }
  };

  const getRecordCount = (tableId: string): number => {
    if (!lastExportResult?.data) return 0;
    const data = lastExportResult.data[tableId];
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'string') return data.split('\n').length - 1;
    return 0;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(f => 
      f.name.endsWith('.json') || f.name.endsWith('.csv')
    );
    setSelectedFiles(validFiles);
    setLastImportResult(null);
  };

  const handleImport = async () => {
    if (selectedFiles.length === 0) return;

    const result = await importDatabase({
      files: selectedFiles,
      conflictStrategy,
    });

    if (result) {
      setLastImportResult({
        results: result.results,
        summary: result.summary,
        imported_at: result.imported_at,
      });
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <AppLayout title="Database Management">
      <div className="p-4 space-y-6 animate-fade-in">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Kembali
          </Link>
        </Button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Database className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Manajemen Database</h1>
            <p className="text-sm text-muted-foreground">
              Export dan import data sistem
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="export" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            {/* Format Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Format Export</CardTitle>
                <CardDescription>Pilih format file output</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="flex items-center gap-2 cursor-pointer">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Date Range Filter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Filter Tanggal (Opsional)
                </CardTitle>
                <CardDescription>Filter data berdasarkan rentang tanggal pembuatan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Dari Tanggal</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Sampai Tanggal</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table Selection */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Pilih Tabel</CardTitle>
                    <CardDescription>Pilih tabel yang ingin diexport</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selectAll"
                      checked={selectedTables.length === EXPORTABLE_TABLES.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="selectAll" className="text-sm cursor-pointer">
                      Pilih Semua
                    </Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXPORTABLE_TABLES.map((table) => (
                    <div
                      key={table.id}
                      className={`flex items-start space-x-3 p-3 rounded-lg border transition-colors ${
                        selectedTables.includes(table.id) ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                    >
                      <Checkbox
                        id={table.id}
                        checked={selectedTables.includes(table.id)}
                        onCheckedChange={(checked) => handleTableToggle(table.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={table.id} className="font-medium cursor-pointer">
                          {table.name}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{table.description}</p>
                        {lastExportResult && selectedTables.includes(table.id) && (
                          <p className="text-xs text-primary mt-1 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {getRecordCount(table.id)} records
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Actions */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="font-medium">
                      {selectedTables.length} tabel dipilih
                    </p>
                    {exportProgress && (
                      <p className="text-sm text-muted-foreground">{exportProgress}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {lastExportResult && (
                      <Button variant="outline" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                    <Button
                      onClick={handleExport}
                      disabled={selectedTables.length === 0 || isExporting}
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mengexport...
                        </>
                      ) : (
                        <>
                          <Database className="h-4 w-4 mr-2" />
                          Export Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export Result */}
            {lastExportResult && (
              <Card className="border-success/30 bg-success/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-success">Export Berhasil!</p>
                      <p className="text-sm text-muted-foreground">
                        Diexport pada {new Date(lastExportResult.exported_at).toLocaleString('id-ID')}
                      </p>
                      {lastExportResult.errors && lastExportResult.errors.length > 0 && (
                        <div className="mt-2 p-2 bg-warning/10 rounded text-sm text-warning">
                          <p className="font-medium">Beberapa tabel gagal diexport:</p>
                          <ul className="list-disc list-inside">
                            {lastExportResult.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            {/* Warning */}
            <Card className="border-warning/30 bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Perhatian</p>
                    <p className="text-sm text-muted-foreground">
                      Import data dapat mengubah data yang sudah ada. Pastikan Anda menggunakan file hasil export yang valid.
                      Disarankan untuk melakukan backup terlebih dahulu.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Pilih File</CardTitle>
                <CardDescription>Upload file JSON atau CSV hasil export</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  multiple
                  onChange={handleFileSelect}
                  className="cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">File terpilih:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {selectedFiles.map((file, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {file.name.endsWith('.json') ? (
                            <FileJson className="h-4 w-4" />
                          ) : (
                            <FileSpreadsheet className="h-4 w-4" />
                          )}
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conflict Strategy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Strategi Konflik</CardTitle>
                <CardDescription>Apa yang dilakukan jika data sudah ada</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup 
                  value={conflictStrategy} 
                  onValueChange={(v) => setConflictStrategy(v as ConflictStrategy)} 
                  className="space-y-3"
                >
                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <RadioGroupItem value="skip" id="skip" className="mt-1" />
                    <div>
                      <Label htmlFor="skip" className="font-medium cursor-pointer">
                        Lewati (Skip)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Jika data dengan ID yang sama sudah ada, lewati dan tidak mengubah data yang ada
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 rounded-lg border">
                    <RadioGroupItem value="update" id="update" className="mt-1" />
                    <div>
                      <Label htmlFor="update" className="font-medium cursor-pointer">
                        Update (Upsert)
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Jika data dengan ID yang sama sudah ada, update dengan data baru
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Importable Tables Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tabel yang Dapat Diimport</CardTitle>
                <CardDescription>Hanya tabel berikut yang akan diproses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {IMPORTABLE_TABLES.map((table) => (
                    <span
                      key={table.id}
                      className="px-2 py-1 bg-muted rounded text-xs font-medium"
                    >
                      {table.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Import Actions */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="font-medium">
                      {selectedFiles.length} file dipilih
                    </p>
                    {importProgress && (
                      <p className="text-sm text-muted-foreground">{importProgress}</p>
                    )}
                  </div>
                  <Button
                    onClick={handleImport}
                    disabled={selectedFiles.length === 0 || isImporting}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengimport...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Import Result */}
            {lastImportResult && (
              <Card className={`border-${lastImportResult.summary.total_failed > 0 ? 'warning' : 'success'}/30 bg-${lastImportResult.summary.total_failed > 0 ? 'warning' : 'success'}/5`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className={`h-5 w-5 ${lastImportResult.summary.total_failed > 0 ? 'text-warning' : 'text-success'} mt-0.5`} />
                    <div className="flex-1">
                      <p className={`font-medium ${lastImportResult.summary.total_failed > 0 ? 'text-warning' : 'text-success'}`}>
                        Import Selesai!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {lastImportResult.summary.total_success} berhasil, {lastImportResult.summary.total_failed} gagal
                      </p>
                      <div className="mt-3 space-y-2">
                        {lastImportResult.results.map((result, i) => (
                          <div key={i} className="p-2 bg-background rounded border">
                            <p className="font-medium text-sm">{result.table}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.success} berhasil, {result.failed} gagal
                            </p>
                            {result.errors.length > 0 && (
                              <ul className="text-xs text-destructive mt-1">
                                {result.errors.map((err, j) => (
                                  <li key={j}>• {err}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

        </Tabs>
      </div>
    </AppLayout>
  );
}
