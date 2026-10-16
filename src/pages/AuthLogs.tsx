 import { useState } from "react";
 import { FileDown, RefreshCw, Search, Filter as FilterIcon } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { Badge } from "@/components/ui/badge";
 import { AppLayout } from "@/components/layout/AppLayout";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
 import { Label } from "@/components/ui/label";
 import {
   useAuthLogs,
   AUTH_EVENT_TYPES,
   getEventLabel,
   getEventVariant,
   exportAuthLogsToCSV,
   AuthLogsFilters,
 } from "@/hooks/useAuthLogs";
 import { formatDistanceToNow } from "date-fns";
 import { id as localeId } from "date-fns/locale";
 
 export default function AuthLogs() {
   const [search, setSearch] = useState("");
   const [filters, setFilters] = useState<AuthLogsFilters>({});
   const [eventFilter, setEventFilter] = useState<string>("");
   const [successFilter, setSuccessFilter] = useState<string>("");
   const [startDate, setStartDate] = useState<string>("");
   const [endDate, setEndDate] = useState<string>("");
 
   const { data: logs = [], isLoading, refetch } = useAuthLogs(filters);
 
   // Apply search filter client-side
   const filteredLogs = logs.filter((log) => {
     if (!search) return true;
     const searchLower = search.toLowerCase();
     return (
       log.event.toLowerCase().includes(searchLower) ||
       log.user_id?.toLowerCase().includes(searchLower) ||
       log.identifier_hash?.toLowerCase().includes(searchLower)
     );
   });
 
   const handleApplyFilters = () => {
     const newFilters: AuthLogsFilters = {};
     
     if (eventFilter) {
       newFilters.event = eventFilter;
     }
     
     if (successFilter) {
       newFilters.success = successFilter === "true";
     }
     
     if (startDate) {
       newFilters.startDate = startDate;
     }
     
     if (endDate) {
       newFilters.endDate = endDate;
     }
     
     setFilters(newFilters);
   };
 
   const handleClearFilters = () => {
     setEventFilter("");
     setSuccessFilter("");
     setStartDate("");
     setEndDate("");
     setFilters({});
   };
 
   const handleExport = () => {
     const timestamp = new Date().toISOString().split("T")[0];
     exportAuthLogsToCSV(filteredLogs, `auth-logs-${timestamp}.csv`);
   };
 
   const activeFiltersCount = Object.keys(filters).length;
 
   return (
     <AppLayout title="Auth Logs">
       <Card>
         <CardHeader>
           <div className="flex items-center justify-between">
             <div>
               <CardTitle>Authentication Logs</CardTitle>
               <CardDescription>
                 Monitor semua aktivitas autentikasi sistem
               </CardDescription>
             </div>
             <div className="flex gap-2">
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => refetch()}
                 disabled={isLoading}
               >
                 <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                 Refresh
               </Button>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={handleExport}
                 disabled={filteredLogs.length === 0}
               >
                 <FileDown className="h-4 w-4 mr-2" />
                 Export CSV
               </Button>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           {/* Search and Filters */}
           <div className="flex gap-4 mb-6">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Cari event, user ID, atau identifier..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="pl-9"
               />
             </div>
             
             {/* Mobile Filter Sheet */}
             <Sheet>
               <SheetTrigger asChild>
                 <Button variant="outline" className="md:hidden">
                   <FilterIcon className="h-4 w-4 mr-2" />
                   Filter
                   {activeFiltersCount > 0 && (
                     <Badge variant="secondary" className="ml-2">
                       {activeFiltersCount}
                     </Badge>
                   )}
                 </Button>
               </SheetTrigger>
               <SheetContent>
                 <SheetHeader>
                   <SheetTitle>Filter Auth Logs</SheetTitle>
                 </SheetHeader>
                 <div className="space-y-4 mt-6">
                   <div className="space-y-2">
                     <Label>Event Type</Label>
                     <Select value={eventFilter} onValueChange={setEventFilter}>
                       <SelectTrigger>
                         <SelectValue placeholder="Semua event" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="">Semua event</SelectItem>
                         {AUTH_EVENT_TYPES.map((type) => (
                           <SelectItem key={type.value} value={type.value}>
                             {type.label}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
 
                   <div className="space-y-2">
                     <Label>Status</Label>
                     <Select value={successFilter} onValueChange={setSuccessFilter}>
                       <SelectTrigger>
                         <SelectValue placeholder="Semua status" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="">Semua status</SelectItem>
                         <SelectItem value="true">Berhasil</SelectItem>
                         <SelectItem value="false">Gagal</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
 
                   <div className="space-y-2">
                     <Label>Tanggal Mulai</Label>
                     <Input
                       type="date"
                       value={startDate}
                       onChange={(e) => setStartDate(e.target.value)}
                     />
                   </div>
 
                   <div className="space-y-2">
                     <Label>Tanggal Akhir</Label>
                     <Input
                       type="date"
                       value={endDate}
                       onChange={(e) => setEndDate(e.target.value)}
                     />
                   </div>
 
                   <div className="flex gap-2 pt-4">
                     <Button onClick={handleApplyFilters} className="flex-1">
                       Terapkan
                     </Button>
                     <Button
                       variant="outline"
                       onClick={handleClearFilters}
                       className="flex-1"
                     >
                       Reset
                     </Button>
                   </div>
                 </div>
               </SheetContent>
             </Sheet>
 
             {/* Desktop Filters */}
             <div className="hidden md:flex gap-2">
               <Select value={eventFilter} onValueChange={setEventFilter}>
                 <SelectTrigger className="w-[180px]">
                   <SelectValue placeholder="Event type" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="">Semua event</SelectItem>
                   {AUTH_EVENT_TYPES.map((type) => (
                     <SelectItem key={type.value} value={type.value}>
                       {type.label}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
 
               <Select value={successFilter} onValueChange={setSuccessFilter}>
                 <SelectTrigger className="w-[140px]">
                   <SelectValue placeholder="Status" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="">Semua status</SelectItem>
                   <SelectItem value="true">Berhasil</SelectItem>
                   <SelectItem value="false">Gagal</SelectItem>
                 </SelectContent>
               </Select>
 
               <Input
                 type="date"
                 value={startDate}
                 onChange={(e) => setStartDate(e.target.value)}
                 placeholder="Dari tanggal"
                 className="w-[160px]"
               />
 
               <Input
                 type="date"
                 value={endDate}
                 onChange={(e) => setEndDate(e.target.value)}
                 placeholder="Sampai tanggal"
                 className="w-[160px]"
               />
 
               <Button onClick={handleApplyFilters} size="sm">
                 Terapkan
               </Button>
 
               {activeFiltersCount > 0 && (
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleClearFilters}
                 >
                   Reset
                 </Button>
               )}
             </div>
           </div>
 
           {/* Results count */}
           <div className="text-sm text-muted-foreground mb-4">
             Menampilkan {filteredLogs.length} dari {logs.length} log
             {activeFiltersCount > 0 && ` (${activeFiltersCount} filter aktif)`}
           </div>
 
           {/* Table */}
           {isLoading ? (
             <div className="space-y-2">
               {Array.from({ length: 5 }).map((_, i) => (
                 <Skeleton key={i} className="h-16 w-full" />
               ))}
             </div>
           ) : filteredLogs.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <p>Tidak ada log ditemukan</p>
             </div>
           ) : (
             <div className="rounded-md border">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Waktu</TableHead>
                     <TableHead>Event</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>User ID</TableHead>
                     <TableHead className="hidden md:table-cell">Identifier Hash</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {filteredLogs.map((log) => (
                     <TableRow key={log.id}>
                       <TableCell className="font-mono text-xs">
                         <div>
                           {new Date(log.created_at).toLocaleString("id-ID")}
                         </div>
                         <div className="text-muted-foreground text-xs">
                           {formatDistanceToNow(new Date(log.created_at), {
                             addSuffix: true,
                             locale: localeId,
                           })}
                         </div>
                       </TableCell>
                       <TableCell>
                        <Badge variant={getEventVariant(log.event)}>
                           {getEventLabel(log.event)}
                         </Badge>
                       </TableCell>
                       <TableCell>
                         <Badge
                          variant={log.success ? "default" : "destructive"}
                         >
                           {log.success ? "Berhasil" : "Gagal"}
                         </Badge>
                       </TableCell>
                       <TableCell className="font-mono text-xs">
                         {log.user_id ? (
                           <span className="text-muted-foreground">
                             {log.user_id.substring(0, 8)}...
                           </span>
                         ) : (
                           <span className="text-muted-foreground">-</span>
                         )}
                       </TableCell>
                       <TableCell className="hidden md:table-cell font-mono text-xs">
                         {log.identifier_hash ? (
                           <span className="text-muted-foreground">
                             {log.identifier_hash.substring(0, 16)}...
                           </span>
                         ) : (
                           <span className="text-muted-foreground">-</span>
                         )}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </div>
           )}
         </CardContent>
       </Card>
     </AppLayout>
   );
 }