import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface QuickActionItem {
  icon: LucideIcon;
  label: string;
  path: string;
  badge?: number | string;
  iconBgClass?: string;
  iconColorClass?: string;
}

interface QuickActionGridProps {
  items: QuickActionItem[];
  columns?: 3 | 4;
  className?: string;
}

export function QuickActionGrid({
  items,
  columns = 4,
  className,
}: QuickActionGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        columns === 4 ? "grid-cols-4" : "grid-cols-3",
        className
      )}
    >
      {items.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-md active:scale-95 transition-all min-h-[88px] relative"
        >
          {item.badge !== undefined && (
            <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1.5 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold">
              {item.badge}
            </Badge>
          )}
          <div
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              item.iconBgClass || "bg-primary/10"
            )}
          >
            <item.icon
              className={cn("h-6 w-6", item.iconColorClass || "text-primary")}
            />
          </div>
          <span className="text-xs font-medium text-center leading-tight text-foreground">
            {item.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
