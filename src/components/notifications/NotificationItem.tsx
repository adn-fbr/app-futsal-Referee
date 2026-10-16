import { formatDistanceToNow } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { 
  Award, 
  Calendar, 
  ClipboardCheck, 
  UserCheck, 
  MessageSquare, 
  BookOpen, 
  Users, 
  CalendarDays, 
  Bell,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/hooks/useNotifications";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  compact?: boolean;
}

const getNotificationIcon = (type: string, action: string) => {
  // Get color based on action
  const isSuccess = ["verified", "approved", "confirmed", "marked_solution"].includes(action);
  const isError = ["rejected", "cancelled", "declined"].includes(action);
  
  const iconClass = cn(
    "h-5 w-5",
    isSuccess && "text-green-500",
    isError && "text-destructive",
    !isSuccess && !isError && "text-primary"
  );

  switch (type) {
    case "honor":
      return <Award className={iconClass} />;
    case "assignment":
      return <Calendar className={iconClass} />;
    case "evaluation":
      return <ClipboardCheck className={iconClass} />;
    case "registration":
      return <UserCheck className={iconClass} />;
    case "discussion":
      return <MessageSquare className={iconClass} />;
    case "learning":
      return <BookOpen className={iconClass} />;
    case "pengurus":
      return <Users className={iconClass} />;
    case "event":
      return <CalendarDays className={iconClass} />;
    default:
      return <Bell className={iconClass} />;
  }
};

const getActionBadge = (action: string) => {
  const isSuccess = ["verified", "approved", "confirmed", "marked_solution", "published"].includes(action);
  const isError = ["rejected", "cancelled", "declined"].includes(action);

  if (isSuccess) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
        <Check className="h-3 w-3" />
      </span>
    );
  }
  
  if (isError) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
        <X className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
      <AlertCircle className="h-3 w-3" />
    </span>
  );
};

export const NotificationItem = ({ notification, onClick, compact = false }: NotificationItemProps) => {
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: localeId,
  });

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-start gap-3 p-3 text-left hover:bg-accent transition-colors",
          !notification.is_read && "bg-accent/50"
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type, notification.action)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={cn(
              "text-sm truncate",
              !notification.is_read && "font-medium"
            )}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="flex-shrink-0 h-2 w-2 bg-primary rounded-full" />
            )}
          </div>
          {notification.message && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {notification.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-4 p-4 text-left hover:bg-accent transition-colors rounded-lg border",
        !notification.is_read && "bg-accent/30 border-primary/20",
        notification.is_read && "border-border"
      )}
    >
      <div className="flex-shrink-0 p-2 bg-muted rounded-full">
        {getNotificationIcon(notification.type, notification.action)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn(
            "text-sm",
            !notification.is_read && "font-semibold"
          )}>
            {notification.title}
          </p>
          {getActionBadge(notification.action)}
          {!notification.is_read && (
            <span className="h-2 w-2 bg-primary rounded-full" />
          )}
        </div>
        {notification.message && (
          <p className="text-sm text-muted-foreground mt-1">
            {notification.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
      </div>
    </button>
  );
};
