 import { AlertCircle, Users, Mail, X } from "lucide-react";
 import { useState } from "react";
 import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
 import { Button } from "@/components/ui/button";
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { 
   useIncompleteProfiles, 
   useIncompleteProfileCount,
   useSendProfileReminder 
 } from "@/hooks/useIncompleteProfiles";
 import { formatDistanceToNow } from "date-fns";
 import { id as localeId } from "date-fns/locale";
 
 export function IncompleteProfilesBanner() {
   const { data: count, isLoading: countLoading } = useIncompleteProfileCount();
   const { data: profiles, isLoading: profilesLoading } = useIncompleteProfiles();
   const sendReminder = useSendProfileReminder();
   const [isDialogOpen, setIsDialogOpen] = useState(false);
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [dismissed, setDismissed] = useState(false);
 
   if (countLoading || !count || count === 0 || dismissed) {
     return null;
   }
 
   const handleSendReminder = (userIds: string[]) => {
     sendReminder.mutate(userIds);
   };
 
   const handleSendBulk = () => {
     if (profiles) {
       handleSendReminder(profiles.map(p => p.id));
     }
   };
 
   const handleSendSelected = () => {
     if (selectedIds.length > 0) {
       handleSendReminder(selectedIds);
       setSelectedIds([]);
     }
   };
 
   const toggleSelection = (id: string) => {
     setSelectedIds(prev => 
       prev.includes(id) 
         ? prev.filter(i => i !== id)
         : [...prev, id]
     );
   };
 
   const toggleSelectAll = () => {
     if (profiles) {
       setSelectedIds(
         selectedIds.length === profiles.length 
           ? [] 
           : profiles.map(p => p.id)
       );
     }
   };
 
   return (
     <>
       <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
         <div className="flex items-start justify-between">
           <div className="flex items-start gap-3 flex-1">
             <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
             <div className="flex-1">
               <AlertTitle className="text-amber-900 dark:text-amber-100">
                 Profil Belum Lengkap
               </AlertTitle>
               <AlertDescription className="text-amber-800 dark:text-amber-200 mt-1">
                 <strong>{count}</strong> user memiliki profil yang belum lengkap dan 
                 perlu menyelesaikan onboarding.
               </AlertDescription>
               <div className="flex gap-2 mt-3">
                 <Button
                   size="sm"
                   variant="outline"
                   onClick={() => setIsDialogOpen(true)}
                   className="border-amber-300 text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-100 dark:hover:bg-amber-900/50"
                 >
                   <Users className="h-4 w-4 mr-2" />
                   Lihat Daftar
                 </Button>
                 <Button
                   size="sm"
                   onClick={handleSendBulk}
                   disabled={sendReminder.isPending}
                   className="bg-amber-600 hover:bg-amber-700 text-white"
                 >
                   <Mail className="h-4 w-4 mr-2" />
                   Kirim Reminder ke Semua
                 </Button>
               </div>
             </div>
           </div>
           <Button
             variant="ghost"
             size="icon"
             onClick={() => setDismissed(true)}
             className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50"
           >
             <X className="h-4 w-4" />
           </Button>
         </div>
       </Alert>
 
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
         <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>User dengan Profil Belum Lengkap</DialogTitle>
             <DialogDescription>
               {count} user perlu menyelesaikan profil mereka untuk mengakses fitur lengkap.
             </DialogDescription>
           </DialogHeader>
 
           {profilesLoading ? (
             <div className="space-y-2">
               {Array.from({ length: 5 }).map((_, i) => (
                 <Skeleton key={i} className="h-16 w-full" />
               ))}
             </div>
           ) : profiles && profiles.length > 0 ? (
             <>
               <div className="rounded-md border">
                 <Table>
                   <TableHeader>
                     <TableRow>
                       <TableHead className="w-12">
                         <input
                           type="checkbox"
                           checked={selectedIds.length === profiles.length}
                           onChange={toggleSelectAll}
                           className="rounded border-gray-300"
                         />
                       </TableHead>
                       <TableHead>Nama</TableHead>
                       <TableHead>Role Diminta</TableHead>
                       <TableHead>Kabupaten/Kota</TableHead>
                       <TableHead>Terdaftar</TableHead>
                       <TableHead className="w-24">Aksi</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {profiles.map((profile) => (
                       <TableRow key={profile.id}>
                         <TableCell>
                           <input
                             type="checkbox"
                             checked={selectedIds.includes(profile.id)}
                             onChange={() => toggleSelection(profile.id)}
                             className="rounded border-gray-300"
                           />
                         </TableCell>
                         <TableCell className="font-medium">
                           {profile.full_name}
                         </TableCell>
                         <TableCell>
                           {profile.requested_role ? (
                             <Badge variant="outline">
                               {profile.requested_role}
                             </Badge>
                           ) : (
                             <span className="text-muted-foreground">-</span>
                           )}
                         </TableCell>
                         <TableCell>
                           {profile.kabupaten_kota_name || "-"}
                         </TableCell>
                         <TableCell className="text-sm text-muted-foreground">
                           {formatDistanceToNow(new Date(profile.created_at), {
                             addSuffix: true,
                             locale: localeId,
                           })}
                         </TableCell>
                         <TableCell>
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => handleSendReminder([profile.id])}
                             disabled={sendReminder.isPending}
                           >
                             <Mail className="h-4 w-4" />
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               </div>
 
               <DialogFooter>
                 <div className="flex items-center justify-between w-full">
                   <div className="text-sm text-muted-foreground">
                     {selectedIds.length > 0 && (
                       <span>{selectedIds.length} user dipilih</span>
                     )}
                   </div>
                   <div className="flex gap-2">
                     <Button
                       variant="outline"
                       onClick={() => setIsDialogOpen(false)}
                     >
                       Tutup
                     </Button>
                     {selectedIds.length > 0 && (
                       <Button
                         onClick={handleSendSelected}
                         disabled={sendReminder.isPending}
                       >
                         <Mail className="h-4 w-4 mr-2" />
                         Kirim ke {selectedIds.length} User
                       </Button>
                     )}
                   </div>
                 </div>
               </DialogFooter>
             </>
           ) : (
             <div className="text-center py-8 text-muted-foreground">
               Tidak ada user dengan profil belum lengkap
             </div>
           )}
         </DialogContent>
       </Dialog>
     </>
   );
 }