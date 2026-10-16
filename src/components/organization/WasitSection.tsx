import { Award, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useRefereesByKabupaten } from "@/hooks/useOrganization";

interface WasitSectionProps {
  kabupatenKotaId: string;
}

export function WasitSection({ kabupatenKotaId }: WasitSectionProps) {
  const { data: referees, isLoading } = useRefereesByKabupaten(kabupatenKotaId);

  if (isLoading) {
    return (
      <div className="pl-8 py-2 text-sm text-muted-foreground">
        Memuat data wasit...
      </div>
    );
  }

  if (!referees || referees.length === 0) {
    return (
      <div className="pl-8 py-2 text-sm text-muted-foreground italic">
        Belum ada wasit terdaftar
      </div>
    );
  }

  return (
    <div className="pl-4 border-l-2 border-primary/20 ml-4 mt-2">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
        <Award className="h-4 w-4 text-primary" />
        <span>Wasit Terdaftar ({referees.length})</span>
      </div>
      <div className="space-y-2">
        {referees.map((referee) => (
          <div
            key={referee.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <Avatar className="h-8 w-8">
              {referee.profile_photo_url ? (
                <AvatarImage src={referee.profile_photo_url} alt={referee.full_name} />
              ) : null}
              <AvatarFallback className="bg-accent/20 text-accent text-xs">
                {referee.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2) || <User className="h-3 w-3" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{referee.full_name}</p>
              <div className="flex items-center gap-2">
                {referee.license_level && (
                  <Badge variant="outline" className="text-[10px] h-4">
                    Level {referee.license_level}
                  </Badge>
                )}
                {referee.is_active === false && (
                  <Badge variant="secondary" className="text-[10px] h-4">
                    Tidak Aktif
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
