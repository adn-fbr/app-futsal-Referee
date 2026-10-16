import { motion } from "framer-motion";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  trend?: "up" | "down";
  trendValue?: string;
}

function StatCard({ title, value, icon, description, trend, trendValue }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-card-foreground">{value}</p>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          {trend && trendValue && (
            <p className={`text-sm font-medium mt-1 ${trend === "up" ? "text-success" : "text-destructive"}`}>
              {trend === "up" ? "↑" : "↓"} {trendValue}
            </p>
          )}
        </div>
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

export default StatCard;
