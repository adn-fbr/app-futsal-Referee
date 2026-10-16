import { useState } from "react";
import { Home, Calendar, Users, ClipboardCheck, MoreHorizontal, Building2, UserCog, UserCheck, Database, BookOpen, MessageSquare, IdCard, FileCheck, FileText } from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingCount } from "@/hooks/useRegistrations";
import { usePendingEventsCount } from "@/hooks/useEvents";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const MobileNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdminProvinsi, isAdmin, kabupatenKotaId } = useAuth();
  const { data: pendingUserCount } = usePendingCount();
  const { data: pendingEventCount } = usePendingEventsCount(isAdminProvinsi() ? undefined : kabupatenKotaId || undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  // Total pending for badge on "More" button
  const totalPendingCount = (pendingUserCount || 0) + (pendingEventCount || 0);
  
  // Main nav items (max 5)
  const mainNavItems = [
    { icon: Home, label: "Beranda", path: "/dashboard" },
    { icon: Calendar, label: "Event", path: "/events" },
    { icon: Users, label: "Wasit", path: "/referees" },
    { icon: ClipboardCheck, label: "Evaluasi", path: "/evaluations" },
  ];

  // Additional items for "More" menu
  const moreNavItems = [
    ...(isAdminProvinsi() ? [
      { icon: FileCheck, label: "Event Approval", path: "/approvals", badge: pendingEventCount },
      { icon: ClipboardCheck, label: "Event Assignment", path: "/administration/event-assignments" },
      { icon: UserCheck, label: "User Approval", path: "/user-approvals", badge: pendingUserCount },
      { icon: Building2, label: "Organisasi", path: "/organization" },
      { icon: UserCog, label: "Manajemen User", path: "/users" },
      { icon: BookOpen, label: "Kelola Materi", path: "/admin/learning" },
      { icon: MessageSquare, label: "Moderasi Diskusi", path: "/admin/discussions" },
      { icon: Database, label: "Export Database", path: "/export" },
      { icon: FileText, label: "Laporan Tahunan", path: "/reports/annual" },
    ] : [
      
    ]),
    ...(isAdmin() ? [
      { icon: IdCard, label: "ID Card Wasit", path: "/admin/id-cards" },
    ] : []),
  ];

  const hasMoreItems = moreNavItems.length > 0;

  const handleMoreItemClick = (path: string) => {
    setSheetOpen(false);
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:hidden pb-safe">
      <div className="flex items-center justify-around py-1">
        {mainNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] min-h-[44px] relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:bg-muted"
              )}
            >
              {isActive && (
                <span className="absolute top-0.5 w-8 h-1 rounded-full bg-primary" />
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
            </NavLink>
          );
        })}

        {hasMoreItems && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[60px] min-h-[44px] relative",
                  "text-muted-foreground hover:text-foreground active:bg-muted"
                )}
              >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl">
                  <MoreHorizontal className="h-5 w-5" />
                  {totalPendingCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">
                      {totalPendingCount > 9 ? "9+" : totalPendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">Lainnya</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="pb-safe rounded-t-3xl">
              <SheetHeader className="pb-4">
                <SheetTitle>Menu Lainnya</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-4 pb-4">
                {moreNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => handleMoreItemClick(item.path)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-muted active:bg-muted transition-all min-h-[80px] relative"
                  >
                    {'badge' in item && item.badge && item.badge > 0 && (
                      <span className="absolute top-1 right-1 h-5 min-w-[20px] px-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-semibold">
                        {item.badge}
                      </span>
                    )}
                    <div className="icon-circle-sm bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
};
