import { CalendarX2, Search, Filter } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface EventEmptyStateProps {
  hasSearchQuery?: boolean;
  hasFilters?: boolean;
}

export function EventEmptyState({ hasSearchQuery, hasFilters }: EventEmptyStateProps) {
  let icon = <CalendarX2 className="h-12 w-12 text-muted-foreground/50" />;
  let title = "Belum ada event";
  let description = "Event yang diajukan akan muncul di sini";

  if (hasSearchQuery) {
    icon = <Search className="h-12 w-12 text-muted-foreground/50" />;
    title = "Event tidak ditemukan";
    description = "Coba gunakan kata kunci lain";
  } else if (hasFilters) {
    icon = <Filter className="h-12 w-12 text-muted-foreground/50" />;
    title = "Tidak ada event yang cocok";
    description = "Coba ubah filter pencarian Anda";
  }

  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center justify-center text-center">
        <div className="mb-4">
          {icon}
        </div>
        <h3 className="font-medium text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
