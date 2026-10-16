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
import { Loader2 } from "lucide-react";
import { Pengurus } from "@/hooks/useOrganization";

interface DeletePengurusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pengurus: Pengurus | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export function DeletePengurusDialog({
  open,
  onOpenChange,
  pengurus,
  onConfirm,
  isLoading,
}: DeletePengurusDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Pengurus</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus{" "}
            <strong>{pengurus?.profile?.full_name || "pengurus ini"}</strong> dari
            jabatan <strong>{pengurus?.jabatan}</strong>?
            <br />
            <br />
            Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
