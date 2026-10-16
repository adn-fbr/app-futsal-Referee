import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, AlertTriangle } from "lucide-react";
import { DuplicateEvent } from "@/hooks/useEvents";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface DuplicateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateEvent[];
  onContinue: () => void;
}

export function DuplicateEventDialog({
  open,
  onOpenChange,
  duplicates,
  onContinue,
}: DuplicateEventDialogProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "destructive";
    if (score >= 70) return "warning";
    return "secondary";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Sangat Mirip";
    if (score >= 70) return "Mirip";
    return "Cukup Mirip";
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertDialogTitle>Event Serupa Ditemukan</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Ditemukan {duplicates.length} event yang mirip dengan event yang akan Anda buat. 
            Silakan periksa untuk memastikan tidak ada duplikasi.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-3 py-4">
          {duplicates.map((dup) => (
            <div
              key={dup.id}
              className="border rounded-lg p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold">{dup.name}</h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(dup.date), "dd MMM yyyy", { locale: localeId })}
                    </div>
                    {dup.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {dup.location}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge variant={getScoreColor(dup.similarity_score) as any}>
                    {getScoreLabel(dup.similarity_score)} ({dup.similarity_score}%)
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {dup.status}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Batalkan Pengajuan</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            Lanjutkan Tetap
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}