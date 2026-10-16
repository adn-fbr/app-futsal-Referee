import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotificationContext } from "@/contexts/NotificationContext";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, getEntityUrl } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { useState } from "react";

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { unreadCount } = useNotificationContext();
  const { data: notifications = [], isLoading } = useNotifications(10);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    setOpen(false);
    const url = getEntityUrl(notification.type, notification.entity_id);
    navigate(url);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate("/notifications");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-primary-foreground hover:bg-primary-foreground/10 min-h-[44px] min-w-[44px]"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-0.5 -right-0.5 h-5 min-w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px]">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Notifikasi</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              Tandai semua dibaca
            </Button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Memuat...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Belum ada notifikasi
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  compact
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <Separator />
        <div className="p-2">
          <Button
            variant="ghost"
            className="w-full text-sm"
            onClick={handleViewAll}
          >
            Lihat Semua Notifikasi
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
