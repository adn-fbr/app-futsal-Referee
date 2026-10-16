import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Filter, Calendar, MapPin, ChevronRight, CalendarDays, RefreshCw } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useEvents, getEventStatusDisplay, EventStatus } from "@/hooks/useEvents";
import { EventFilterSheet, EventFilters } from "@/components/events/EventFilterSheet";
import { EventListSkeleton } from "@/components/events/EventCardSkeleton";
import { EventEmptyState } from "@/components/events/EventEmptyState";
import { useAutoCompleteEvents, useManualAutoComplete } from "@/hooks/useAutoCompleteEvents";
import { useAuth } from "@/contexts/AuthContext";
import { formatEventDateRange } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const statusTabs = [
  { value: "all", label: "Semua" },
  { value: "DIAJUKAN", label: "Diajukan" },
  { value: "DISETUJUI", label: "Disetujui" },
  { value: "DITOLAK", label: "Ditolak" },
  { value: "SELESAI", label: "Selesai" },
];

export default function Events() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdminProvinsi } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(searchParams.get("status") || "all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<EventFilters>({
    kabupatenKotaId: searchParams.get("kabupatenKotaId") || null,
    category: null,
  });
  
  // Auto-complete events check on page load
  useAutoCompleteEvents();

  useEffect(() => {
    const status = searchParams.get("status");
    if (status && statusTabs.some((tab) => tab.value === status)) {
      setActiveTab(status);
    }
  }, [searchParams]);

  useEffect(() => {
    const kabupatenKotaId = searchParams.get("kabupatenKotaId");
    setFilters((current) => ({
      ...current,
      kabupatenKotaId: kabupatenKotaId || null,
    }));
  }, [searchParams]);
  
  const { data: events, isLoading } = useEvents();
  const { mutate: runAutoComplete, isPending: autoCompleting } = useManualAutoComplete();

  const filteredEvents = useMemo(() => {
    return events?.filter((event) => {
      const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" || event.status === activeTab;
      const matchesKabKota = !filters.kabupatenKotaId || event.kabupaten_kota_id === filters.kabupatenKotaId;
      const matchesCategory = !filters.category || event.category === filters.category;
      return matchesSearch && matchesTab && matchesKabKota && matchesCategory;
    }) || [];
  }, [events, searchQuery, activeTab, filters]);

  const activeFilterCount = [filters.kabupatenKotaId, filters.category].filter(Boolean).length;
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <AppLayout title="Event">
      <div className="p-4 space-y-4 animate-fade-in">
        {/* Search and Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => navigate("/events/calendar")} title="Lihat Kalender" className="h-11 w-11">
            <CalendarDays className="h-4 w-4" />
          </Button>
          {isAdminProvinsi() && (
            <Button 
              variant="outline" 
              size="icon" 
              className="h-11 w-11"
              onClick={() => runAutoComplete()}
              disabled={autoCompleting}
              title="Auto-complete event yang sudah lewat"
            >
              <RefreshCw className={cn("h-4 w-4", autoCompleting && "animate-spin")} />
            </Button>
          )}
          <Button 
            variant={hasActiveFilters ? "default" : "outline"} 
            size="icon" 
            className="h-11 w-11 relative"
            onClick={() => setShowFilterSheet(true)}
          >
            <Filter className="h-4 w-4" />
            {hasActiveFilters && (
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary-foreground text-primary"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>

        {/* Scrollable Tabs */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  const next = new URLSearchParams(searchParams);
                  if (tab.value === "all") {
                    next.delete("status");
                  } else {
                    next.set("status", tab.value);
                  }
                  setSearchParams(next, { replace: true });
                }}
                className={cn(
                  "inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] min-w-[80px]",
                  activeTab === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/60"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-1" />
        </ScrollArea>

        {/* Event List */}
        <div className="space-y-3">
          {isLoading ? (
            <EventListSkeleton count={5} />
          ) : filteredEvents.length === 0 ? (
            <EventEmptyState 
              hasSearchQuery={!!searchQuery} 
              hasFilters={hasActiveFilters || activeTab !== "all"} 
            />
          ) : (
            filteredEvents.map((event) => {
              const statusDisplay = getEventStatusDisplay(event.status as EventStatus);

              return (
                <Link key={event.id} to={`/events/${event.id}`}>
                  <Card className="hover:shadow-md active:bg-muted/50 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm mb-1 truncate">{event.name}</h3>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              {formatEventDateRange(event)}
                            </span>
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate max-w-[120px]">{event.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={statusDisplay.variant}>
                            {statusDisplay.label}
                          </StatusBadge>
                          {event.kabupaten_kota && (
                            <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                              {event.kabupaten_kota.name}
                            </span>
                          )}
                        </div>
                        {event.category && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {event.category}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        {/* FAB */}
        <Button
          size="lg"
          className="fixed bottom-24 right-4 md:bottom-8 rounded-full shadow-lg h-14 px-5 gap-2"
          onClick={() => navigate("/events/submit")}
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Ajukan</span>
        </Button>

        {/* Filter Sheet */}
        <EventFilterSheet
          open={showFilterSheet}
          onOpenChange={setShowFilterSheet}
          filters={filters}
          onApplyFilters={setFilters}
        />
      </div>
    </AppLayout>
  );
}
