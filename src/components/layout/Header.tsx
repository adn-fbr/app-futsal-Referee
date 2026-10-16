import { Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
}

export const Header = ({ title = "FFSS", onMenuClick }: HeaderProps) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-foreground shadow-md">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex text-primary-foreground hover:bg-primary-foreground/10 min-h-[44px] min-w-[44px]"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary-foreground/20 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold">FF</span>
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{title}</h1>
              <p className="text-[10px] text-primary-foreground/70">Sulawesi Selatan</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/10 min-h-[44px] min-w-[44px]"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>Profil Saya</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                Pengaturan
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
