import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Award, MapPin, Calendar } from "lucide-react";
import { RefereeCard } from "@/hooks/useRefereeCard";
import { formatLicenseLevel } from "@/lib/formatters";
import ffiLogo from "@/assets/ffi-logo.png";

interface RefereeIDCardProps {
  card: RefereeCard;
  verificationUrl: string;
}

export const RefereeIDCard = forwardRef<HTMLDivElement, RefereeIDCardProps>(
  ({ card, verificationUrl }, ref) => {
    const referee = card.referee;

    return (
      <div
        ref={ref}
        className="w-[340px] bg-gradient-to-br from-primary via-primary to-accent rounded-2xl shadow-2xl overflow-hidden"
        style={{ aspectRatio: "85.6/54" }}
      >
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm px-4 py-2 flex items-center justify-between">
          <img src={ffiLogo} alt="FFI Logo" className="h-8 w-auto" />
          <div className="text-right">
            <p className="text-[10px] text-primary-foreground/80 font-medium">
              FEDERASI FUTSAL INDONESIA
            </p>
            <p className="text-[8px] text-primary-foreground/60">
              SULAWESI SELATAN
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-3 flex gap-3">
          {/* Photo */}
          <div className="flex-shrink-0">
            <div className="w-20 h-24 rounded-lg overflow-hidden border-2 border-white/30 bg-white/20">
              {referee?.profile_photo_url ? (
                <img
                  src={referee.profile_photo_url}
                  alt={referee.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Award className="h-8 w-8 text-primary-foreground/50" />
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 text-primary-foreground">
            <h2 className="font-bold text-base leading-tight truncate">
              {referee?.full_name || "Nama Wasit"}
            </h2>
            <p className="text-xs text-primary-foreground/80 font-medium mt-0.5">
              Wasit Futsal
            </p>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-primary-foreground/90">
                <Award className="h-3 w-3" />
                <span>{formatLicenseLevel(referee?.license_level)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-primary-foreground/90">
                <MapPin className="h-3 w-3" />
                <span className="truncate">
                  {referee?.kabupaten_kota?.name || referee?.afk_origin || "-"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-primary-foreground/90">
                <Calendar className="h-3 w-3" />
                <span>
                  s/d{" "}
                  {card.expires_at
                    ? format(new Date(card.expires_at), "dd MMM yyyy", { locale: id })
                    : "Tidak terbatas"}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <div className="bg-white p-1.5 rounded-lg">
              <QRCodeSVG
                value={verificationUrl}
                size={60}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-[6px] text-primary-foreground/60 mt-1 text-center">
              Scan untuk verifikasi
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/20 px-4 py-1.5 flex items-center justify-between">
          <p className="text-[9px] text-primary-foreground/80 font-mono">
            {card.card_number}
          </p>
          <p className="text-[8px] text-primary-foreground/60">
            Issued: {format(new Date(card.issued_at), "dd/MM/yyyy")}
          </p>
        </div>
      </div>
    );
  }
);

RefereeIDCard.displayName = "RefereeIDCard";
