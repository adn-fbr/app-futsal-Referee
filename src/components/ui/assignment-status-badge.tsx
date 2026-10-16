import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import type { AssignmentStatus } from "@/hooks/useEventAssignments";
import { cn } from "@/lib/utils";

export const assignmentStatusConfig = {
  pending: {
    label: "Menunggu",
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
  },
  confirmed: {
    label: "Dikonfirmasi",
    className:
      "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
  },
  declined: {
    label: "Ditolak",
    className:
      "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  },
  cancelled: {
    label: "Dibatalkan",
    className:
      "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  },
} as const;

const assignmentStatusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors whitespace-nowrap",
  {
    variants: {
      status: {
        pending: assignmentStatusConfig.pending.className,
        confirmed: assignmentStatusConfig.confirmed.className,
        declined: assignmentStatusConfig.declined.className,
        cancelled: assignmentStatusConfig.cancelled.className,
      },
    },
    defaultVariants: {
      status: "pending",
    },
  },
);

interface AssignmentStatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof assignmentStatusBadgeVariants> {
  status: AssignmentStatus;
  children?: React.ReactNode;
}

export function AssignmentStatusBadge({
  status,
  className,
  children,
  ...props
}: AssignmentStatusBadgeProps) {
  const finalChildren = children ?? assignmentStatusConfig[status].label;

  return (
    <div
      className={cn(assignmentStatusBadgeVariants({ status }), className)}
      {...props}
    >
      {finalChildren}
    </div>
  );
}
