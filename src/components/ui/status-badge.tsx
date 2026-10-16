import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      status: {
        success: "bg-success/15 text-success border border-success/30",
        warning: "bg-warning/15 text-warning border border-warning/30",
        info: "bg-info/15 text-info border border-info/30",
        error: "bg-destructive/15 text-destructive border border-destructive/30",
        neutral: "bg-muted text-muted-foreground border border-border",
        primary: "bg-primary/15 text-primary border border-primary/30",
      },
    },
    defaultVariants: {
      status: "neutral",
    },
  }
);

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
}

export function StatusBadge({ status, className, children, ...props }: StatusBadgeProps) {
  return (
    <span className={cn(statusBadgeVariants({ status }), className)} {...props}>
      {children}
    </span>
  );
}
