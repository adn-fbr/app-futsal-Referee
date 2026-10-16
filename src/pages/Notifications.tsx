import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNotifications, useMarkAsRead, useMarkAllAsRead, getEntityUrl } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { Skeleton } from "@/components/ui/skeleton";

const NOTIFICATION_TYPES = [
  { value: "all", label: "Semua" },
  { value: "event", label: "Event" },
  { value: "honor", label: "Honor" },
  { value: "assignment", label: "Penugasan" },
  { value: "evaluation", label: "Evaluasi" },
  { value: "registration", label: "Registrasi" },
  { value: "discussion", label: "Diskusi" },
  { value: "learning", label: "Materi" },
  { value: "pengurus", label: "Pengurus" },
];

const Notifications = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  
  const { data: notifications = [], isLoading } = useNotifications(100);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    const matchesTab = tab === "all" || (tab === "unread" && !n.is_read);
    const matchesType = typeFilter === "all" || n.type === typeFilter;
    return matchesTab && matchesType;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      markAsRead.mutate(notification.id);
    }
    const url = getEntityUrl(notification.type, notification.entity_id);
    navigate(url);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0 
              ? `${unreadCount} notifikasi belum dibaca` 
              : "Semua notifikasi sudah dibaca"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="unread">
              Belum Dibaca
              {unreadCount > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="font-medium text-lg">Tidak ada notifikasi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {tab === "unread" 
                ? "Semua notifikasi sudah dibaca" 
                : "Belum ada notifikasi untuk ditampilkan"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => handleNotificationClick(notification)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
