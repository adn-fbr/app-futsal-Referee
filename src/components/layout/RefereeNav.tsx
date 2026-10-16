import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Wallet,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Home", path: "/referee" },
  { icon: CalendarDays, label: "Event", path: "/referee/events" },
  { icon: Wallet, label: "Honor", path: "/referee/honor" },
  { icon: MessageSquare, label: "Diskusi", path: "/referee/discussions" },
  { icon: User, label: "Profil", path: "/referee/profile" },
];

export const RefereeNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-all min-h-[44px] relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-1 w-8 h-1 rounded-full bg-primary" />
              )}
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl transition-all",
                  isActive && "bg-primary/10"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5]")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
