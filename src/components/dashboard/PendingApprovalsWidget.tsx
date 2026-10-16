import { Clock, UserCheck, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePendingEventsCount } from "@/hooks/useEvents";
import { usePendingCount } from "@/hooks/useRegistrations";
import { useAuth } from "@/contexts/AuthContext";

export function PendingApprovalsWidget() {
  const { kabupatenKotaId, isAdminProvinsi } = useAuth();
  
  // Apply regional filter for admin kab/kota
  const regionalFilter = isAdminProvinsi() ? undefined : kabupatenKotaId || undefined;
  
  const { data: pendingEventsCount, isLoading: eventsLoading } = usePendingEventsCount(regionalFilter);
  const { data: pendingUsersCount, isLoading: usersLoading } = usePendingCount();

  const isLoading = eventsLoading || usersLoading;
  const totalPending = (pendingEventsCount || 0) + (pendingUsersCount || 0);

  if (totalPending === 0 && !isLoading) {
    return null;
  }

  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-5 w-5 text-warning" />
          Menunggu Persetujuan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {(pendingEventsCount || 0) > 0 && (
              <Link
                to="/approvals"
                className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="icon-circle-sm bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Event Baru</p>
                    <p className="text-xs text-muted-foreground">
                      {pendingEventsCount} event menunggu review
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            )}

            {(pendingUsersCount || 0) > 0 && isAdminProvinsi() && (
              <Link
                to="/user-approvals"
                className="flex items-center justify-between p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="icon-circle-sm bg-info/10">
                    <UserCheck className="h-4 w-4 text-info" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pendaftaran User</p>
                    <p className="text-xs text-muted-foreground">
                      {pendingUsersCount} user menunggu approval
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            )}

            <div className="flex gap-2 pt-2">
              {(pendingEventsCount || 0) > 0 && (
                <Button asChild size="sm" className="flex-1">
                  <Link to="/approvals">
                    Review Event
                  </Link>
                </Button>
              )}
              {(pendingUsersCount || 0) > 0 && isAdminProvinsi() && (
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <Link to="/user-approvals">
                    Review User
                  </Link>
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
