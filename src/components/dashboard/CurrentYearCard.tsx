import { CalendarDays, Clock3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentYear } from "@/contexts/CurrentYearContext";

export function CurrentYearCard() {
  const { currentYear, formattedToday, periodLabel } = useCurrentYear();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="grid gap-4 p-4 sm:grid-cols-3 sm:items-center">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tahun Berjalan</p>
            <p className="text-xl font-bold text-primary">{currentYear}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock3 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hari Ini</p>
            <p className="text-sm font-medium capitalize">{formattedToday}</p>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Periode Laporan</p>
          <p className="text-sm font-medium">{periodLabel}</p>
        </div>
      </CardContent>
    </Card>
  );
}
