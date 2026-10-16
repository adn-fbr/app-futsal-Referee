import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Users, Crown, User, X, Save } from "lucide-react";

interface BatchAssignmentBarProps {
  selectedCount: number;
  onAssign: (role: "UTAMA" | "CADANGAN") => void;
  onClear: () => void;
  onSaveAsTemplate: () => void;
  isAssigning?: boolean;
}

export function BatchAssignmentBar({
  selectedCount,
  onAssign,
  onClear,
  onSaveAsTemplate,
  isAssigning,
}: BatchAssignmentBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"UTAMA" | "CADANGAN">("CADANGAN");

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 bg-background border border-border rounded-lg shadow-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </Badge>
            <span className="font-medium">
              {selectedCount} wasit dipilih
            </span>
          </div>

          <div className="h-6 border-l border-border" />

          <Select
            value={selectedRole}
            onValueChange={(v: "UTAMA" | "CADANGAN") => setSelectedRole(v)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTAMA">
                <div className="flex items-center gap-2">
                  <Crown className="h-3 w-3" />
                  Utama
                </div>
              </SelectItem>
              <SelectItem value="CADANGAN">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Cadangan
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={isAssigning}
          >
            {isAssigning ? "Menugaskan..." : "Tugaskan Semua"}
          </Button>

          <Button variant="outline" size="icon" onClick={onSaveAsTemplate}>
            <Save className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tugaskan {selectedCount} Wasit?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menugaskan {selectedCount} wasit sebagai{" "}
              <span className="font-semibold">
                {selectedRole === "UTAMA" ? "Wasit Utama" : "Wasit Cadangan"}
              </span>{" "}
              untuk event ini. Setiap wasit akan menerima notifikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onAssign(selectedRole);
                setConfirmOpen(false);
              }}
            >
              Tugaskan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
