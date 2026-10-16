import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function EventListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
