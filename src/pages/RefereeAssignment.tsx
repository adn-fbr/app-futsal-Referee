import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trophy,
  Search,
  UserPlus,
  UserMinus,
  Users,
  AlertTriangle,
  Crown,
  User,
  Sparkles,
  FileText,
  Filter,
} from "lucide-react";
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
import { useEvent } from "@/hooks/useEvents";
import {
  useEventAssignments,
  useAvailableReferees,
  useAssignReferee,
  useUpdateAssignment,
  useRemoveAssignment,
  type RefereeRole,
  type AvailableReferee,
  type EventAssignment,
} from "@/hooks/useEventAssignments";
import {
  useSmartRefereeSuggestions,
  useBatchAssignReferees,
  type SmartReferee,
} from "@/hooks/useSmartAssignment";
import { getLicenseBadgeColor } from "@/hooks/useReferees";
import { formatEventDateRangeFull } from "@/lib/dateUtils";
import { SmartSuggestionCard } from "@/components/assignment/SmartSuggestionCard";
import { BatchAssignmentBar } from "@/components/assignment/BatchAssignmentBar";
import { SaveTemplateDialog, ApplyTemplateDialog } from "@/components/assignment/AssignmentTemplateDialog";

export default function RefereeAssignment() {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<RefereeRole>("CADANGAN");
  const [selectedReferees, setSelectedReferees] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"smart" | "all">("smart");
  const [filterRecommendation, setFilterRecommendation] = useState<string>("all");
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [applyTemplateOpen, setApplyTemplateOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "assign" | "remove";
    referee?: AvailableReferee | SmartReferee;
    assignment?: EventAssignment;
  }>({ open: false, action: "assign" });

  const { data: event, isLoading: eventLoading, error: eventError, refetch: refetchEvent } = useEvent(eventId || "");
  const { data: assignments, isLoading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useEventAssignments(eventId || "");
  const { data: availableReferees, isLoading: refereesLoading, error: refereesError, refetch: refetchReferees } = useAvailableReferees(eventId || "");
  const { data: smartSuggestions, isLoading: suggestionsLoading, refetch: refetchSuggestions, error: suggestionsError } = useSmartRefereeSuggestions(
    eventId || "",
    event?.kabupaten_kota_id || null,
    event?.category || null
  );

  const assignMutation = useAssignReferee();
  const updateMutation = useUpdateAssignment();
  const removeMutation = useRemoveAssignment();
  const batchAssignMutation = useBatchAssignReferees();

  const assignmentQueryError = assignmentsError || refereesError || suggestionsError;
  const retryAssignmentQueries = () => {
    void Promise.all([refetchAssignments(), refetchReferees(), refetchSuggestions()]);
  };

  // Filter smart suggestions
  const filteredSmartSuggestions = useMemo(() => {
    let filtered = smartSuggestions || [];

    if (searchQuery) {
      filtered = filtered.filter((r) =>
        r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterRecommendation !== "all") {
      filtered = filtered.filter((r) => r.recommendation === filterRecommendation);
    }

    return filtered;
  }, [smartSuggestions, searchQuery, filterRecommendation]);

  // Filter available referees (for "all" tab)
  const filteredReferees = useMemo(() => {
    return (availableReferees || []).filter((ref) =>
      ref.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableReferees, searchQuery]);

  const refereesWithoutConflict = filteredReferees.filter((r) => !r.has_conflict);
  const refereesWithConflict = filteredReferees.filter((r) => r.has_conflict);

  // Selected referees info for template saving
  const selectedRefereesInfo = useMemo(() => {
    const allReferees = [...(smartSuggestions || []), ...(availableReferees || [])];
    return Array.from(selectedReferees).map((id) => {
      const ref = allReferees.find((r) => r.id === id);
      return {
        refereeId: id,
        name: ref?.full_name || "Unknown",
        role: selectedRole,
      };
    });
  }, [selectedReferees, smartSuggestions, availableReferees, selectedRole]);

  const handleAssign = (referee: AvailableReferee | SmartReferee) => {
    setConfirmDialog({ open: true, action: "assign", referee });
  };

  const handleRemove = (assignment: EventAssignment) => {
    setConfirmDialog({ open: true, action: "remove", assignment });
  };

  const handleRoleChange = (assignmentId: string, newRole: RefereeRole) => {
    if (updateMutation.isPending) return;
    updateMutation.mutate({ assignmentId, role: newRole });
  };

  const handleSelectReferee = (refereeId: string, selected: boolean) => {
    setSelectedReferees((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(refereeId);
      } else {
        next.delete(refereeId);
      }
      return next;
    });
  };

  const handleBatchAssign = async (role: RefereeRole) => {
    if (selectedReferees.size === 0) return;

    await batchAssignMutation.mutateAsync({
      eventId: eventId!,
      assignments: Array.from(selectedReferees).map((refereeId) => ({
        refereeId,
        role,
      })),
    });

    setSelectedReferees(new Set());
  };

  const confirmAction = async () => {
    if (confirmDialog.action === "assign" && confirmDialog.referee) {
      await assignMutation.mutateAsync({
        eventId: eventId!,
        refereeId: confirmDialog.referee.id,
        role: selectedRole,
      });
    } else if (confirmDialog.action === "remove" && confirmDialog.assignment) {
      await removeMutation.mutateAsync({ assignmentId: confirmDialog.assignment.id });
    }
    setConfirmDialog({ open: false, action: "assign" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (eventLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-12 w-64 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-4" role="alert">
          <h2 className="text-xl font-semibold mb-2">Event gagal dimuat</h2>
          <p className="text-sm text-muted-foreground mb-4">{eventError instanceof Error ? eventError.message : "Terjadi kesalahan saat memuat event."}</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>
            <Button onClick={() => void refetchEvent()}>Coba lagi</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Event tidak ditemukan</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  const isApproved = event.status === "DISETUJUI";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Penugasan Wasit</h1>
              <p className="text-xs text-muted-foreground">
                {isApproved ? "Tugaskan wasit untuk event" : "Event belum disetujui"}
              </p>
            </div>
          </div>

          {isApproved && (
            <Button variant="outline" onClick={() => setApplyTemplateOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Template
            </Button>
          )}
        </div>
      </header>
        {assignmentQueryError && (
          <div className="mx-auto max-w-7xl px-4 pt-4" role="alert">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-destructive">Data penugasan atau rekomendasi gagal dimuat. Silakan coba lagi.</p>
                <Button variant="outline" size="sm" onClick={retryAssignmentQueries}>Coba lagi</Button>
              </CardContent>
            </Card>
          </div>
        )}

      <main className="p-4 pb-24 max-w-7xl mx-auto">
        {!isApproved && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <p className="text-sm">
                Event harus disetujui terlebih dahulu sebelum dapat menugaskan wasit.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Event Info & Assigned Referees */}
          <div className="lg:col-span-1 space-y-4">
            {/* Event Information */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Informasi Event</CardTitle>
                    </div>
                  </div>
                  <StatusBadge status={isApproved ? "success" : "warning"}>
                    {event.status}
                  </StatusBadge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-lg">{event.name}</h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{formatEventDateRangeFull(event)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{event.location}</span>
                  </div>
                )}
                {event.kabupaten_kota && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{event.kabupaten_kota.name}</span>
                  </div>
                )}
                {event.category && (
                  <Badge variant="secondary">{event.category}</Badge>
                )}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Wasit Ditugaskan</span>
                    <Badge variant="secondary">{assignments?.length || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Referees */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Wasit Ditugaskan
                </CardTitle>
                <CardDescription>
                  {assignmentsLoading
                    ? "Memuat..."
                    : assignments?.length === 0
                    ? "Belum ada wasit yang ditugaskan"
                    : `${assignments?.length} wasit telah ditugaskan`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignmentsLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : assignments?.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Pilih wasit dari daftar</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignments?.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={assignment.referee?.profile_photo_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {getInitials(assignment.referee?.full_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{assignment.referee?.full_name}</p>
                            <div className="flex items-center gap-2">
                              {assignment.referee?.license_level && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getLicenseBadgeColor(assignment.referee.license_level)}`}
                                >
                                  {assignment.referee.license_level}
                                </Badge>
                              )}
                              <Select
                                value={assignment.role}
                                onValueChange={(value: RefereeRole) =>
                                  handleRoleChange(assignment.id, value)
                                }
                              >
                                <SelectTrigger disabled={updateMutation.isPending} className="h-6 w-auto text-xs px-2 border-none bg-transparent">
                                  <div className="flex items-center gap-1">
                                    {assignment.role === "UTAMA" ? (
                                      <Crown className="h-3 w-3" />
                                    ) : (
                                      <User className="h-3 w-3" />
                                    )}
                                    <SelectValue />
                                  </div>
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
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(assignment)}
                          disabled={removeMutation.isPending || updateMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Available Referees */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">Pilih Wasit</CardTitle>
                      <CardDescription>
                        {isApproved
                          ? "Pilih wasit untuk ditugaskan ke event ini"
                          : "Setujui event terlebih dahulu"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={selectedRole}
                        onValueChange={(value: RefereeRole) => setSelectedRole(value)}
                        disabled={!isApproved}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Peran" />
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
                    </div>
                  </div>

                  {isApproved && (
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "smart" | "all")}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <TabsList>
                          <TabsTrigger value="smart" className="flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4" />
                            Rekomendasi
                          </TabsTrigger>
                          <TabsTrigger value="all" className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            Semua
                          </TabsTrigger>
                        </TabsList>

                        <div className="flex items-center gap-2 flex-1">
                          <div className="relative flex-1 sm:max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Cari wasit..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9"
                            />
                          </div>

                          {activeTab === "smart" && (
                            <Select
                              value={filterRecommendation}
                              onValueChange={setFilterRecommendation}
                            >
                              <SelectTrigger className="w-36">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua</SelectItem>
                                <SelectItem value="high">Sangat Cocok</SelectItem>
                                <SelectItem value="medium">Cukup Cocok</SelectItem>
                                <SelectItem value="low">Kurang Cocok</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </Tabs>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!isApproved ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Event harus disetujui untuk menugaskan wasit</p>
                  </div>
                ) : activeTab === "smart" ? (
                  // Smart suggestions tab
                  suggestionsLoading ? (
                    <div className="grid grid-cols-1 gap-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40" />
                      ))}
                    </div>
                  ) : filteredSmartSuggestions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Tidak ada rekomendasi tersedia</p>
                      <Button
                        variant="link"
                        onClick={() => setActiveTab("all")}
                        className="mt-1"
                      >
                        Lihat semua wasit
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {filteredSmartSuggestions.map((referee) => (
                        <SmartSuggestionCard
                          key={referee.id}
                          referee={referee}
                          selected={selectedReferees.has(referee.id)}
                          onSelect={(selected) => handleSelectReferee(referee.id, selected)}
                          onAssign={() => handleAssign(referee)}
                          isAssigning={assignMutation.isPending}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  // All referees tab
                  refereesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                  ) : refereesError ? (
                    <div className="text-center py-12 text-destructive">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{refereesError.message}</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {refereesWithoutConflict.map((referee) => (
                          <Card
                            key={referee.id}
                            className={`border-border hover:border-primary/30 transition-colors ${
                              selectedReferees.has(referee.id) ? "border-primary ring-2 ring-primary/20" : ""
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedReferees.has(referee.id)}
                                    onChange={(e) => handleSelectReferee(referee.id, e.target.checked)}
                                    className="mt-1"
                                  />
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={referee.profile_photo_url || undefined} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                      {getInitials(referee.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-semibold">{referee.full_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      {referee.license_level && (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${getLicenseBadgeColor(referee.license_level)}`}
                                        >
                                          {referee.license_level}
                                        </Badge>
                                      )}
                                      {referee.kabupaten_kota_name && (
                                        <span className="text-xs text-muted-foreground">
                                          {referee.kabupaten_kota_name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-end mt-3 pt-3 border-t">
                                <Button
                                  size="sm"
                                  onClick={() => handleAssign(referee)}
                                  disabled={assignMutation.isPending}
                                >
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Tugaskan
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {refereesWithoutConflict.length === 0 && refereesWithConflict.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                          <p>Tidak ada wasit tersedia</p>
                          {searchQuery && (
                            <Button
                              variant="link"
                              onClick={() => setSearchQuery("")}
                              className="mt-1"
                            >
                              Reset pencarian
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Referees with conflicts */}
                      {refereesWithConflict.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            Wasit dengan Jadwal Bentrok ({refereesWithConflict.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {refereesWithConflict.map((referee) => (
                              <Card
                                key={referee.id}
                                className="border-border bg-muted/30 opacity-60"
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={referee.profile_photo_url || undefined} />
                                      <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                                        {getInitials(referee.full_name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{referee.full_name}</p>
                                      <p className="text-xs text-warning">
                                        Sudah bertugas di tanggal yang sama
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Batch Assignment Bar */}
      <BatchAssignmentBar
        selectedCount={selectedReferees.size}
        onAssign={handleBatchAssign}
        onClear={() => setSelectedReferees(new Set())}
        onSaveAsTemplate={() => setSaveTemplateOpen(true)}
        isAssigning={batchAssignMutation.isPending}
      />

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "assign"
                ? "Tugaskan Wasit?"
                : "Batalkan Penugasan?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "assign" ? (
                <>
                  Anda akan menugaskan{" "}
                  <span className="font-semibold">{confirmDialog.referee?.full_name}</span>{" "}
                  sebagai wasit{" "}
                  <span className="font-semibold">{selectedRole.toLowerCase()}</span> untuk
                  event ini.
                </>
              ) : (
                <>
                  Anda akan membatalkan penugasan{" "}
                  <span className="font-semibold">
                    {confirmDialog.assignment?.referee?.full_name}
                  </span>{" "}
                  dari event ini.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              disabled={assignMutation.isPending || removeMutation.isPending}
              className={
                confirmDialog.action === "remove"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {assignMutation.isPending || removeMutation.isPending
                ? "Memproses..."
                : confirmDialog.action === "assign" ? "Tugaskan" : "Batalkan Penugasan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Template Dialogs */}
      <SaveTemplateDialog
        open={saveTemplateOpen}
        onOpenChange={setSaveTemplateOpen}
        selectedReferees={selectedRefereesInfo}
      />

      <ApplyTemplateDialog
        open={applyTemplateOpen}
        onOpenChange={setApplyTemplateOpen}
        eventId={eventId || ""}
        onApply={() => {}}
      />
    </div>
  );
}
