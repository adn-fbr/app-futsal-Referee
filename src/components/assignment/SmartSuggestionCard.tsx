import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  Award,
  Calendar,
  Star,
  AlertTriangle,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { getLicenseBadgeColor } from "@/hooks/useReferees";
import type { SmartReferee } from "@/hooks/useSmartAssignment";

interface SmartSuggestionCardProps {
  referee: SmartReferee;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onAssign: () => void;
  isAssigning?: boolean;
  showScores?: boolean;
}

export function SmartSuggestionCard({
  referee,
  selected,
  onSelect,
  onAssign,
  isAssigning,
  showScores = true,
}: SmartSuggestionCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRecommendationColor = (rec: "high" | "medium" | "low") => {
    switch (rec) {
      case "high":
        return "bg-success/10 text-success border-success/30";
      case "medium":
        return "bg-warning/10 text-warning border-warning/30";
      case "low":
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getRecommendationLabel = (rec: "high" | "medium" | "low") => {
    switch (rec) {
      case "high":
        return "Sangat Cocok";
      case "medium":
        return "Cukup Cocok";
      case "low":
        return "Kurang Cocok";
    }
  };

  return (
    <Card
      className={`transition-all ${
        referee.has_conflict
          ? "opacity-60 bg-muted/30"
          : selected
          ? "border-primary ring-2 ring-primary/20"
          : "hover:border-primary/30"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          {!referee.has_conflict && (
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="mt-1"
            />
          )}

          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={referee.profile_photo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(referee.full_name)}
            </AvatarFallback>
          </Avatar>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold truncate">{referee.full_name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {referee.license_level && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getLicenseBadgeColor(referee.license_level)}`}
                    >
                      {referee.license_level}
                    </Badge>
                  )}
                  {referee.kabupaten_kota_name && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {referee.kabupaten_kota_name}
                    </span>
                  )}
                </div>
              </div>

              {/* Recommendation badge */}
              <Badge
                variant="outline"
                className={`text-xs shrink-0 ${getRecommendationColor(referee.recommendation)}`}
              >
                {referee.recommendation === "high" && (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {getRecommendationLabel(referee.recommendation)}
              </Badge>
            </div>

            {/* Score breakdown */}
            {showScores && !referee.has_conflict && (
              <div className="mt-3 space-y-2">
                <TooltipProvider>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-20">
                          <MapPin className="h-3 w-3" />
                          <span>Lokasi</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Kedekatan dengan lokasi event</p>
                      </TooltipContent>
                    </Tooltip>
                    <Progress value={referee.proximityScore} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">
                      {referee.proximityScore}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-20">
                          <Award className="h-3 w-3" />
                          <span>Lisensi</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Kesesuaian level lisensi</p>
                      </TooltipContent>
                    </Tooltip>
                    <Progress value={referee.licenseLevelScore} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">
                      {referee.licenseLevelScore}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground w-20">
                          <Calendar className="h-3 w-3" />
                          <span>Jadwal</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ketersediaan jadwal</p>
                      </TooltipContent>
                    </Tooltip>
                    <Progress value={referee.availabilityScore} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground w-8">
                      {referee.availabilityScore}%
                    </span>
                  </div>
                </TooltipProvider>

                {/* Total score */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    <Star className="h-3 w-3 text-primary" />
                    <span>Skor Total</span>
                  </div>
                  <span className="text-sm font-bold text-primary">
                    {referee.totalScore}
                  </span>
                </div>
              </div>
            )}

            {/* Conflict warning */}
            {referee.has_conflict && (
              <div className="mt-3 flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="h-3 w-3" />
                <span>Sudah bertugas di tanggal yang sama</span>
              </div>
            )}

            {/* Action button */}
            {!referee.has_conflict && (
              <div className="flex justify-end mt-3 pt-3 border-t">
                <Button
                  size="sm"
                  onClick={onAssign}
                  disabled={isAssigning}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Tugaskan
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
