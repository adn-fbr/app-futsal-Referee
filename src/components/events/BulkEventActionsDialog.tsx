 import { useState } from "react";
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
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 
 interface BulkEventActionsDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   action: "approve" | "reject" | null;
   eventCount: number;
   onConfirm: (notes?: string) => void;
   isLoading: boolean;
 }
 
 export function BulkEventActionsDialog({
   open,
   onOpenChange,
   action,
   eventCount,
   onConfirm,
   isLoading,
 }: BulkEventActionsDialogProps) {
   const [notes, setNotes] = useState("");
 
   const handleConfirm = () => {
     onConfirm(notes || undefined);
     setNotes("");
   };
 
   const handleCancel = () => {
     onOpenChange(false);
     setNotes("");
   };
 
   return (
     <AlertDialog open={open} onOpenChange={onOpenChange}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>
             {action === "approve" ? "Setujui Event" : "Tolak Event"}
           </AlertDialogTitle>
           <AlertDialogDescription>
             Anda akan {action === "approve" ? "menyetujui" : "menolak"}{" "}
             <strong>{eventCount}</strong> event sekaligus.
             {action === "reject" && " Tindakan ini tidak dapat dibatalkan."}
           </AlertDialogDescription>
         </AlertDialogHeader>
 
         <div className="space-y-2 py-4">
           <Label htmlFor="notes">
             {action === "approve" ? "Catatan (opsional)" : "Alasan penolakan (opsional)"}
           </Label>
           <Textarea
             id="notes"
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
             placeholder={
               action === "approve"
                 ? "Tambahkan catatan jika diperlukan..."
                 : "Jelaskan alasan penolakan..."
             }
             rows={4}
             disabled={isLoading}
           />
         </div>
 
         <AlertDialogFooter>
           <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
             Batal
           </AlertDialogCancel>
           <AlertDialogAction
             onClick={handleConfirm}
             disabled={isLoading}
             className={
               action === "reject"
                 ? "bg-destructive hover:bg-destructive/90"
                 : ""
             }
           >
             {isLoading ? (
               <span className="flex items-center gap-2">
                 <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                 {action === "approve" ? "Menyetujui..." : "Menolak..."}
               </span>
             ) : action === "approve" ? (
               "Setujui Semua"
             ) : (
               "Tolak Semua"
             )}
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   );
 }