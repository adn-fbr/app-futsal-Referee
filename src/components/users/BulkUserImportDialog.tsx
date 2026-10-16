import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useBulkCreateUsers, useKabupatenKota, type BulkUserData } from "@/hooks/useUsers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import type { AppRole } from "@/contexts/AuthContext";

const VALID_ROLES: AppRole[] = ["admin_provinsi", "admin_kab_kota", "panitia", "wasit", "evaluator"];

const ROLE_LABELS: Record<string, string> = {
  admin_provinsi: "Admin Provinsi",
  admin_kab_kota: "Admin Kab/Kota",
  panitia: "Panitia",
  wasit: "Wasit",
  evaluator: "Evaluator",
};

const bulkUserRowSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z
    .string()
    .min(8, "Password min 8 karakter")
    .regex(/[a-zA-Z]/, "Password harus ada huruf")
    .regex(/[0-9]/, "Password harus ada angka"),
  full_name: z.string().min(1, "Nama wajib diisi").max(100, "Nama maksimal 100 karakter"),
  role: z.enum(["admin_provinsi", "admin_kab_kota", "panitia", "wasit", "evaluator"], {
    errorMap: () => ({ message: "Role tidak valid" }),
  }),
  kabupaten_kota_name: z.string().optional(),
});

interface ParsedUser extends BulkUserData {
  isValid: boolean;
  errors: string[];
  rowNumber: number;
}

interface BulkUserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkUserImportDialog({ open, onOpenChange }: BulkUserImportDialogProps) {
  const { data: kabupatenKotaList, isLoading: isLoadingKabupaten } = useKabupatenKota();
  const bulkCreateUsers = useBulkCreateUsers();

  const [fileType, setFileType] = useState<"csv" | "json">("csv");
  const [parsedUsers, setParsedUsers] = useState<ParsedUser[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCheckingEmails, setIsCheckingEmails] = useState(false);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    results: { email: string; status: string; message?: string }[];
  } | null>(null);

  // Build kabupaten/kota lookup map
  const kabupatenKotaMap = useMemo(() => {
    const map = new Map<string, string>();
    (kabupatenKotaList || []).forEach((k) => {
      map.set(k.name.toLowerCase().trim(), k.name);
    });
    return map;
  }, [kabupatenKotaList]);

  // Fetch existing emails when dialog opens
  useEffect(() => {
    if (open) {
      fetchExistingEmails();
    }
  }, [open]);

  const fetchExistingEmails = async () => {
    setIsCheckingEmails(true);
    try {
      // Use edge function to get existing emails (auth.users not directly accessible)
      const { data, error } = await supabase
        .from("profiles")
        .select("id");
      
      if (error) throw error;
      
      // Get emails from auth using admin endpoint would be ideal, 
      // but we'll validate during import. For now, we just track IDs
      setExistingEmails(new Set());
    } catch (error) {
      console.error("Error fetching existing emails:", error);
    } finally {
      setIsCheckingEmails(false);
    }
  };

  const validateRow = useCallback(
    (row: Partial<BulkUserData>, rowNumber: number): ParsedUser => {
      const errors: string[] = [];
      
      // Trim all string values
      const cleanedRow = {
        email: row.email?.trim().toLowerCase() || "",
        password: row.password || "",
        full_name: row.full_name?.trim() || "",
        role: row.role?.trim().toLowerCase() as AppRole,
        kabupaten_kota_name: row.kabupaten_kota_name?.trim() || undefined,
      };
      
      // Validate with zod
      const result = bulkUserRowSchema.safeParse(cleanedRow);
      if (!result.success) {
        result.error.errors.forEach((e) => {
          if (!errors.includes(e.message)) {
            errors.push(e.message);
          }
        });
      }

      // Check kabupaten_kota_name exists
      if (cleanedRow.kabupaten_kota_name) {
        const normalizedName = cleanedRow.kabupaten_kota_name.toLowerCase().trim();
        if (!kabupatenKotaMap.has(normalizedName)) {
          errors.push(`Kab/Kota "${cleanedRow.kabupaten_kota_name}" tidak ditemukan`);
        } else {
          // Use the correctly cased name from the map
          cleanedRow.kabupaten_kota_name = kabupatenKotaMap.get(normalizedName);
        }
      }

      // Check kabupaten_kota required for non-admin_provinsi
      if (cleanedRow.role && cleanedRow.role !== "admin_provinsi" && !cleanedRow.kabupaten_kota_name) {
        errors.push("Kab/Kota wajib untuk role ini");
      }

      return {
        ...cleanedRow,
        isValid: errors.length === 0,
        errors,
        rowNumber,
      };
    },
    [kabupatenKotaMap]
  );

  // Parse CSV with proper handling of quoted values
  const parseCSV = useCallback(
    (content: string): ParsedUser[] => {
      const lines = content.trim().split(/\r?\n/);
      if (lines.length < 2) return [];

      // Parse header
      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().trim());
      
      // Validate required headers
      const requiredHeaders = ["email", "password", "full_name", "role"];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast.error(`Header tidak lengkap: ${missingHeaders.join(", ")}`);
        return [];
      }

      const users: ParsedUser[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        const values = parseCSVLine(line);
        const row: Partial<BulkUserData> = {};

        headers.forEach((header, index) => {
          const value = values[index] || "";
          if (header === "email") row.email = value;
          else if (header === "password") row.password = value;
          else if (header === "full_name" || header === "nama" || header === "name") row.full_name = value;
          else if (header === "role") row.role = value as AppRole;
          else if (header === "kabupaten_kota_name" || header === "kabupaten_kota" || header === "kab_kota") {
            row.kabupaten_kota_name = value || undefined;
          }
        });

        users.push(validateRow(row, i + 1));
      }

      return users;
    },
    [validateRow]
  );

  // Helper function to parse CSV line with proper quote handling
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    
    return result;
  };

  const parseJSON = useCallback(
    (content: string): ParsedUser[] => {
      try {
        const data = JSON.parse(content);
        if (!Array.isArray(data)) {
          toast.error("Format JSON harus berupa array");
          return [];
        }

        if (data.length === 0) {
          toast.error("File JSON kosong");
          return [];
        }

        return data.map((row, index) => validateRow(row, index + 1));
      } catch (error) {
        toast.error("Format JSON tidak valid");
        return [];
      }
    },
    [validateRow]
  );

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        toast.error("Ukuran file maksimal 1MB");
        event.target.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        if (!content.trim()) {
          toast.error("File kosong");
          return;
        }

        const users = fileType === "csv" ? parseCSV(content) : parseJSON(content);
        
        if (users.length === 0) {
          toast.error("Tidak ada data user yang ditemukan");
          return;
        }

        if (users.length > 100) {
          toast.error("Maksimal 100 user per batch");
          return;
        }
        
        // Check for duplicate emails within file
        const emailCounts = new Map<string, number[]>();
        users.forEach((u) => {
          const email = u.email.toLowerCase();
          const rows = emailCounts.get(email) || [];
          rows.push(u.rowNumber);
          emailCounts.set(email, rows);
        });

        users.forEach((u) => {
          const email = u.email.toLowerCase();
          const rows = emailCounts.get(email) || [];
          if (rows.length > 1) {
            u.isValid = false;
            const otherRows = rows.filter(r => r !== u.rowNumber);
            u.errors.push(`Email duplikat (baris ${otherRows.join(", ")})`);
          }
        });

        setParsedUsers(users);
        setImportResults(null);
        
        const validCount = users.filter(u => u.isValid).length;
        const invalidCount = users.filter(u => !u.isValid).length;
        
        if (invalidCount > 0) {
          toast.warning(`${validCount} valid, ${invalidCount} error`);
        } else {
          toast.success(`${validCount} user siap diimport`);
        }
      };
      
      reader.onerror = () => {
        toast.error("Gagal membaca file");
      };
      
      reader.readAsText(file);
      
      // Reset the input value to allow re-uploading the same file
      event.target.value = "";
    },
    [fileType, parseCSV, parseJSON]
  );

  const handleImport = async () => {
    const validUsers = parsedUsers.filter((u) => u.isValid);
    if (validUsers.length === 0) {
      toast.error("Tidak ada user valid untuk diimport");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await bulkCreateUsers.mutateAsync(
        validUsers.map((u) => ({
          email: u.email,
          password: u.password,
          full_name: u.full_name,
          role: u.role,
          kabupaten_kota_name: u.kabupaten_kota_name,
        }))
      );

      setImportResults({
        total: result.summary.total,
        success: result.summary.success,
        failed: result.summary.failed,
        results: result.results,
      });

      if (result.summary.success > 0 && result.summary.failed === 0) {
        toast.success(`${result.summary.success} user berhasil dibuat`);
      } else if (result.summary.success > 0) {
        toast.warning(`${result.summary.success} berhasil, ${result.summary.failed} gagal`);
      } else {
        toast.error(`Import gagal: ${result.summary.failed} user gagal dibuat`);
      }
    } catch (error: any) {
      toast.error(error.message || "Import gagal");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = (format: "csv" | "json") => {
    // Get sample kabupaten/kota name
    const sampleKabKota = kabupatenKotaList?.[0]?.name || "Kota Makassar";
    
    if (format === "csv") {
      const BOM = "\uFEFF"; // For Excel compatibility
      const csvContent = `email,password,full_name,role,kabupaten_kota_name
    wasit1@example.com,<required-password>,Nama Wasit Satu,wasit,${sampleKabKota}
    evaluator1@example.com,<required-password>,Nama Evaluator,evaluator,${sampleKabKota}
    admin_kota@example.com,<required-password>,Admin Kab Kota,admin_kab_kota,${sampleKabKota}
    admin_prov@example.com,<required-password>,Admin Provinsi,admin_provinsi,`;
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_import_users.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template CSV berhasil diunduh");
    } else {
      const jsonContent = JSON.stringify(
        [
          {
            email: "wasit1@example.com",
            password: "<required-password>",
            full_name: "Nama Wasit Satu",
            role: "wasit",
            kabupaten_kota_name: sampleKabKota,
          },
          {
            email: "evaluator1@example.com",
            password: "<required-password>",
            full_name: "Nama Evaluator",
            role: "evaluator",
            kabupaten_kota_name: sampleKabKota,
          },
          {
            email: "admin_prov@example.com",
            password: "<required-password>",
            full_name: "Admin Provinsi",
            role: "admin_provinsi",
            kabupaten_kota_name: "",
          },
        ],
        null,
        2
      );
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_import_users.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Template JSON berhasil diunduh");
    }
  };

  const resetDialog = () => {
    setParsedUsers([]);
    setImportResults(null);
    setIsProcessing(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  };

  const validCount = parsedUsers.filter((u) => u.isValid).length;
  const invalidCount = parsedUsers.filter((u) => !u.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Bulk Users</DialogTitle>
          <DialogDescription>
            Upload file CSV atau JSON untuk membuat banyak user sekaligus
          </DialogDescription>
        </DialogHeader>

        {importResults ? (
          <div className="flex-1 space-y-4 overflow-hidden">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <div className="text-2xl font-bold">{importResults.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="p-4 rounded-lg bg-green-100 text-center">
                <div className="text-2xl font-bold text-green-700">{importResults.success}</div>
                <div className="text-sm text-green-600">Berhasil</div>
              </div>
              <div className="p-4 rounded-lg bg-red-100 text-center">
                <div className="text-2xl font-bold text-red-700">{importResults.failed}</div>
                <div className="text-sm text-red-600">Gagal</div>
              </div>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.results.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{result.email}</TableCell>
                      <TableCell>
                        {result.status === "success" ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Sukses
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Gagal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.message || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-hidden">
            {isLoadingKabupaten ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">Memuat data kabupaten/kota...</span>
              </div>
            ) : (
              <>
                <Tabs value={fileType} onValueChange={(v) => { setFileType(v as "csv" | "json"); setParsedUsers([]); }}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="csv">CSV</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                  </TabsList>

                  <TabsContent value="csv" className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => downloadTemplate("csv")}>
                        <Download className="h-4 w-4 mr-1" />
                        Download Template
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <strong>Format CSV:</strong> email, password, full_name, role, kabupaten_kota_name
                      <br />
                      <strong>Role valid:</strong> admin_provinsi, admin_kab_kota, panitia, wasit, evaluator
                    </div>
                  </TabsContent>

                  <TabsContent value="json" className="space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => downloadTemplate("json")}>
                        <Download className="h-4 w-4 mr-1" />
                        Download Template
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                      <strong>Format JSON:</strong> Array of objects dengan field email, password, full_name, role, kabupaten_kota_name
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label>Upload File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept={fileType === "csv" ? ".csv,.txt" : ".json"}
                      onChange={handleFileUpload}
                      className="flex-1"
                      disabled={isCheckingEmails}
                    />
                    {parsedUsers.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setParsedUsers([])}
                        title="Reset"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maksimal 100 user per batch • Ukuran file maks 1MB
                  </p>
                </div>
              </>
            )}

            {parsedUsers.length > 0 && !isLoadingKabupaten && (
              <>
                <div className="flex items-center gap-4 text-sm flex-wrap">
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {parsedUsers.length} user
                  </span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {validCount} valid
                  </Badge>
                  {invalidCount > 0 && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3 w-3 mr-1" />
                      {invalidCount} error
                    </Badge>
                  )}
                </div>

                <ScrollArea className="h-[250px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead className="min-w-[180px]">Email</TableHead>
                        <TableHead className="min-w-[120px]">Nama</TableHead>
                        <TableHead className="w-28">Role</TableHead>
                        <TableHead className="min-w-[120px]">Kab/Kota</TableHead>
                        <TableHead className="w-32">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedUsers.map((user) => (
                        <TableRow 
                          key={user.rowNumber} 
                          className={!user.isValid ? "bg-destructive/5" : ""}
                        >
                          <TableCell className="text-muted-foreground font-mono text-xs">
                            {user.rowNumber}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {user.email || <span className="text-muted-foreground italic">kosong</span>}
                          </TableCell>
                          <TableCell>
                            {user.full_name || <span className="text-muted-foreground italic">kosong</span>}
                          </TableCell>
                          <TableCell>
                            {user.role ? (
                              <Badge variant="secondary" className="text-xs">
                                {ROLE_LABELS[user.role] || user.role}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {user.kabupaten_kota_name || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                          <TableCell>
                            {user.isValid ? (
                              <div className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Valid</span>
                              </div>
                            ) : (
                              <div className="flex items-start gap-1">
                                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                <div className="text-xs text-destructive">
                                  {user.errors.slice(0, 2).map((err, i) => (
                                    <div key={i}>{err}</div>
                                  ))}
                                  {user.errors.length > 2 && (
                                    <div className="text-muted-foreground">
                                      +{user.errors.length - 2} lainnya
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={undefined} className="h-2" />
                <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses {validCount} user...
                </p>
              </div>
            )}
          </div>
        )}
        

        <DialogFooter>
          {importResults ? (
            <Button onClick={() => handleOpenChange(false)}>Tutup</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Batal
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import {validCount} User
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
