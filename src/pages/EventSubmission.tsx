import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentUpload } from "@/components/ui/document-upload";
import { ArrowLeft, CalendarIcon, MapPin, Trophy, CheckCircle2, FileText } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateEvent } from "@/hooks/useEvents";
import { useKabupatenKotaList } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Disable dates before today
const today = startOfDay(new Date());

const EventSubmission = () => {
  const navigate = useNavigate();
  const { user, isAdminProvinsi } = useAuth();
  const createEvent = useCreateEvent();
  const { data: kabupatenKotaList } = useKabupatenKotaList();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [formData, setFormData] = useState({
    eventName: "",
    location: "",
    description: "",
    category: "",
    kabupatenKotaId: "",
  });

  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);
  const [tempDocumentPath, setTempDocumentPath] = useState<string | null>(null);

  const totalSteps = 3;
  const canCreateHistoricalEvent = isAdminProvinsi();
  const isHistoricalEvent = Boolean(startDate && startDate < today);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDocumentChange = (preview: string | null, file: File | null) => {
    setDocumentPreview(preview);
    setDocumentFile(file);
    if (file && user) {
      uploadTempDocument(file);
    }
  };

  const uploadTempDocument = async (file: File) => {
    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `temp/${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Temp upload error:", uploadError);
        toast.error("Gagal menyimpan dokumen sementara: " + uploadError.message);
        return;
      }

      setTempDocumentPath(fileName);
      localStorage.setItem("eventDraftTempDoc", fileName);

      const { data } = supabase.storage.from("documents").getPublicUrl(fileName);
      setDocumentPreview(data?.publicUrl ?? null);
    } catch (err) {
      console.error("Failed to upload temp document:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const saveDraftNow = () => {
    try {
      localStorage.setItem(
        "eventDraft",
        JSON.stringify({
          formData,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          currentStep,
        })
      );
    } catch (err) {
      console.warn("Failed to save draft immediately", err);
    }

    if (tempDocumentPath) {
      try {
        localStorage.setItem("eventDraftTempDoc", tempDocumentPath);
      } catch (err) {
        console.warn("Failed to save temp doc path", err);
      }
    }
  };

  const isStep1Valid = formData.eventName.trim() !== "";
  const isStep2Valid = startDate && endDate && formData.location.trim() !== "";
  const isStep3Valid = true; // Optional fields

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowConfirmation(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !user) return;

    try {
      setIsUploading(true);
      let documentPath: string | undefined;

      // Prefer temp upload (already saved) to avoid re-upload on submit
      if (tempDocumentPath) {
        documentPath = tempDocumentPath;
      } else if (documentFile) {
        const fileExt = documentFile.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(fileName, documentFile);

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error("Gagal mengupload dokumen: " + uploadError.message);
          setIsUploading(false);
          return;
        }

        documentPath = fileName;
      }

      // Create event
      const eventData = await createEvent.mutateAsync({
        name: formData.eventName,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        location: formData.location,
        description: formData.description || undefined,
        category: formData.category || undefined,
        kabupaten_kota_id: formData.kabupatenKotaId || undefined,
        created_by: user.id,
      });

      // Send email notification for event submission
      if (eventData) {
        try {
          const { error: notifyError } = await supabase.functions.invoke(
            "send-event-notification",
            {
              body: { 
                eventId: eventData.id,
                type: "submission",
                documentPath: documentPath || null,
              },
            }
          );

          if (notifyError) {
            console.error("Notification error:", notifyError);
            // Don't block submission, just log the error
          } else {
            toast.success("Notifikasi email berhasil dikirim ke asosiasi");
          }
        } catch (err) {
          console.error("Failed to send notification:", err);
        }
      }

      setShowConfirmation(false);
      localStorage.removeItem("eventDraft");
      localStorage.removeItem("eventDraftTempDoc");
      setIsSubmitted(true);
    } catch (_error) {
      // Error handled by mutation
    } finally {
      setIsUploading(false);
    }
  };

  // Persist draft (basic) to localStorage so progress isn't lost on mobile picker reload
  useEffect(() => {
    try {
      localStorage.setItem(
        "eventDraft",
        JSON.stringify({
          formData,
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          currentStep,
        })
      );
    } catch (err) {
      // ignore quota errors
      console.warn("Failed to persist event draft", err);
    }
  }, [formData, startDate, endDate, currentStep]);

  // Restore draft on mount
  useEffect(() => {
    const stored = localStorage.getItem("eventDraft");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.startDate) setStartDate(new Date(parsed.startDate));
        if (parsed.endDate) setEndDate(new Date(parsed.endDate));
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
      } catch (err) {
        console.warn("Failed to restore event draft", err);
      }
    }

    const tempDoc = localStorage.getItem("eventDraftTempDoc");
    if (tempDoc) {
      setTempDocumentPath(tempDoc);
    }
  }, []);

  // Fetch preview when user is available (storage public url may depend on auth)
  useEffect(() => {
    if (user && tempDocumentPath && !documentPreview) {
      try {
        const { data } = supabase.storage.from("documents").getPublicUrl(tempDocumentPath);
        setDocumentPreview(data?.publicUrl ?? null);
      } catch (err) {
        console.warn("Failed to fetch temp document preview", err);
      }
    }
  }, [user, tempDocumentPath, documentPreview]);

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-2">Event Berhasil Diajukan!</h2>
            <p className="text-muted-foreground mb-4">
              Pengajuan event Anda sedang ditinjau oleh Admin Provinsi.
              {documentFile && " Email notifikasi telah dikirim ke asosiasi."}
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">Status:</span>
              <StatusBadge status="warning">Diajukan</StatusBadge>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 text-left mb-6">
              <h3 className="font-semibold mb-2">{formData.eventName}</h3>
              <p className="text-sm text-muted-foreground">
                {startDate && endDate && (
                  startDate.getTime() === endDate.getTime()
                    ? format(startDate, "d MMMM yyyy", { locale: id })
                    : `${format(startDate, "d MMMM yyyy", { locale: id })} - ${format(endDate, "d MMMM yyyy", { locale: id })}`
                )}
              </p>
              <p className="text-sm text-muted-foreground">{formData.location}</p>
              {documentFile && (
                <p className="text-sm text-primary mt-2">📎 {documentFile.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => navigate("/events")}>
                Lihat Daftar Event
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
                Kembali ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Ajukan Event</h1>
            <p className="text-xs text-muted-foreground">
              Langkah {currentStep} dari {totalSteps}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </header>

      <main className="p-4 pb-24 max-w-lg mx-auto">
        {/* Step 1: Event Name */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Nama Event</CardTitle>
              <CardDescription>
                Masukkan nama lengkap event futsal yang akan diselenggarakan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eventName">Nama Event *</Label>
                <Input
                  id="eventName"
                  placeholder="Contoh: Piala Walikota Futsal 2025"
                  value={formData.eventName}
                  onChange={(e) => handleInputChange("eventName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="liga">Liga</SelectItem>
                    <SelectItem value="turnamen">Turnamen</SelectItem>
                    <SelectItem value="pelajar">Antar Pelajar</SelectItem>
                    <SelectItem value="sekolah">Antar Sekolah</SelectItem>
                    <SelectItem value="mahasiswa">Antar Mahasiswa</SelectItem>
                    <SelectItem value="instansi">Antar Instansi</SelectItem>
                    <SelectItem value="umum">Umum</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Date & Location */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <CalendarIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Jadwal & Lokasi</CardTitle>
              <CardDescription>
                Tentukan tanggal pelaksanaan dan lokasi event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tanggal Mulai *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? (
                          format(startDate, "d MMM yyyy", { locale: id })
                        ) : (
                          <span>Pilih</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          // Auto-set end date if not set or if it's before start date
                          if (date && (!endDate || endDate < date)) {
                            setEndDate(date);
                          }
                        }}
                        disabled={(date) => !canCreateHistoricalEvent && date < today}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Tanggal Selesai *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? (
                          format(endDate, "d MMM yyyy", { locale: id })
                        ) : (
                          <span>Pilih</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        disabled={(date) => (!canCreateHistoricalEvent && date < today) || (startDate ? date < startDate : false)}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              
              {startDate && endDate && startDate.getTime() !== endDate.getTime() && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  Durasi event: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} hari
                </p>
              )}

              {isHistoricalEvent && canCreateHistoricalEvent && (
                <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning" role="status">
                  <p className="font-medium">Historical Event</p>
                  <p>Tanggal event telah berlalu. Event tetap dapat dibuat oleh Admin Provinsi dan akan melalui proses validasi yang berlaku.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="location">Lokasi *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    className="pl-10"
                    placeholder="Contoh: GOR Sudiang, Makassar"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Kabupaten/Kota</Label>
                <Select value={formData.kabupatenKotaId} onValueChange={(v) => handleInputChange("kabupatenKotaId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kabupaten/kota" />
                  </SelectTrigger>
                  <SelectContent>
                    {kabupatenKotaList?.map((kk) => (
                      <SelectItem key={kk.id} value={kk.id}>{kk.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Description & Document */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Deskripsi & Dokumen</CardTitle>
              <CardDescription>
                Tambahkan informasi dan surat permohonan (opsional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi Event</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan detail event, jumlah tim, format pertandingan, dll."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                />
              </div>

              <DocumentUpload
                value={documentPreview}
                file={documentFile}
                onChange={handleDocumentChange}
                onOpen={saveDraftNow}
                label="Surat Permohonan"
                maxSizeMB={5}
              />
              <p className="text-xs text-muted-foreground">
                Upload surat permohonan untuk dikirim ke email asosiasi
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full h-12 text-base"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === totalSteps ? "Ajukan Event" : "Lanjutkan"}
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengajuan</DialogTitle>
            <DialogDescription>
              Pastikan data event sudah benar sebelum mengajukan
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Nama Event</span>
              <span className="text-sm font-medium">{formData.eventName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tanggal Mulai</span>
              <span className="text-sm font-medium">
                {startDate && format(startDate, "d MMMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Tanggal Selesai</span>
              <span className="text-sm font-medium">
                {endDate && format(endDate, "d MMMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Lokasi</span>
              <span className="text-sm font-medium">{formData.location}</span>
            </div>
            {formData.category && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kategori</span>
                <span className="text-sm font-medium">{formData.category}</span>
              </div>
            )}
            {documentFile && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Dokumen</span>
                <span className="text-sm font-medium text-primary">📎 {documentFile.name}</span>
              </div>
            )}
          </div>
          {documentFile && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              Email notifikasi akan dikirim ke asosiasi dengan lampiran dokumen
            </p>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setShowConfirmation(false)}
              disabled={isUploading || createEvent.isPending}
            >
              Batal
            </Button>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSubmit}
              disabled={isUploading || createEvent.isPending}
            >
              {isUploading || createEvent.isPending ? "Mengajukan..." : "Konfirmasi & Ajukan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventSubmission;
