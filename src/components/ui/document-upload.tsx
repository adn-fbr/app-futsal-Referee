import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  value: string | null;
  file: File | null;
  onChange: (preview: string | null, file: File | null) => void;
  onOpen?: () => void;
  label?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  required?: boolean;
}

export function DocumentUpload({
  value,
  file,
  onChange,
  onOpen,
  label = "Upload Dokumen",
  maxSizeMB = 5,
  disabled = false,
  required = false,
}: DocumentUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setError(null);

      // Check file type
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setError("Format file harus JPG, PNG, atau PDF");
        return false;
      }

      // Check file size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Ukuran file maksimal ${maxSizeMB}MB`);
        return false;
      }

      return true;
    },
    [maxSizeMB]
  );

  const handleFileChange = useCallback(
    (selectedFile: File) => {
      if (!validateFile(selectedFile)) return;

      // For images, create preview
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          onChange(reader.result as string, selectedFile);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        // For PDF, just store file info
        onChange(selectedFile.name, selectedFile);
      }
    },
    [onChange, validateFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleRemove = () => {
    onChange(null, null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      // notify parent and persist a small marker so draft can be restored if picker causes an unload
      onOpen?.();
      try { localStorage.setItem('eventPickerOpenedAt', Date.now().toString()); } catch (err) { console.warn('Failed to mark picker open', err); }
      inputRef.current?.click();
    }
  };

  const isPDF = file?.type === "application/pdf";
  const isImage = file?.type?.startsWith("image/");

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>

      {value ? (
        <div className="relative rounded-lg border border-border bg-muted/30 p-4">
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1.5 text-destructive-foreground shadow-sm hover:bg-destructive/90 disabled:opacity-50 z-10"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          {isPDF ? (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file && (file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : isImage ? (
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
                <img
                  src={value}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file && (file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm truncate">{value}</p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onTouchStart={(e) => { e.stopPropagation(); handleClick(); }}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Upload className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-center">
            Klik atau drag file ke sini
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, atau PDF (Maks {maxSizeMB}MB)
          </p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
