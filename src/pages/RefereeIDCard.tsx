import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  IdCard,
  QrCode,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RefereeNav } from "@/components/layout/RefereeNav";
import { RefereeIDCard } from "@/components/referee/RefereeIDCard";
import {
  useMyRefereeCard,
  useGenerateCard,
  useRegenerateCard,
} from "@/hooks/useRefereeCard";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function RefereeIDCardPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: card, isLoading } = useMyRefereeCard();
  const generateCard = useGenerateCard();
  const regenerateCard = useRegenerateCard();

  const verificationUrl = card
    ? `${window.location.origin}/verify/${card.verification_code}`
    : "";

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      link.download = `ID-Card-${card?.card_number || "wasit"}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("ID Card berhasil diunduh");
    } catch (error) {
      toast.error("Gagal mengunduh ID Card");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerate = () => {
    if (user?.id) {
      generateCard.mutate(user.id);
    }
  };

  const handleRegenerate = () => {
    if (card?.id) {
      regenerateCard.mutate();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <StatusBadge status="success">Aktif</StatusBadge>;
      case "suspended":
        return <StatusBadge status="warning">Disuspend</StatusBadge>;
      case "revoked":
        return <StatusBadge status="error">Dicabut</StatusBadge>;
      case "expired":
        return <StatusBadge status="neutral">Kadaluarsa</StatusBadge>;
      default:
        return <StatusBadge status="neutral">{status}</StatusBadge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="gradient-primary text-primary-foreground p-4">
        <div className="flex items-center gap-3">
          <Link to="/referee/profile">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">ID Card Wasit</h1>
            <p className="text-xs text-primary-foreground/80">
              Kartu identitas digital Anda
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {!card ? (
          /* No Card - Generate */
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <IdCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">
                Belum Memiliki ID Card
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Buat ID Card digital Anda untuk keperluan verifikasi keabsahan
                sebagai wasit.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={generateCard.isPending}
              >
                {generateCard.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <IdCard className="h-4 w-4 mr-2" />
                )}
                Buat ID Card
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ID Card Display */}
            <div className="flex justify-center">
              <div className="print:block">
                <RefereeIDCard
                  ref={cardRef}
                  card={card}
                  verificationUrl={verificationUrl}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 print:hidden">
              <Button
                className="flex-1"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Download
              </Button>
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
            </div>

            {/* Card Info */}
            <Card className="print:hidden">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Informasi Kartu</span>
                  {getStatusBadge(card.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Nomor Kartu</p>
                    <p className="font-mono font-medium">{card.card_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Tanggal Terbit
                    </p>
                    <p className="font-medium">
                      {format(new Date(card.issued_at), "dd MMM yyyy", {
                        locale: id,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Berlaku Sampai</p>
                    <p className="font-medium">
                      {card.expires_at
                        ? format(new Date(card.expires_at), "dd MMM yyyy", {
                            locale: id,
                          })
                        : "Tidak terbatas"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">
                      Jumlah Verifikasi
                    </p>
                    <p className="font-medium">{card.verification_count}x</p>
                  </div>
                </div>

                {card.last_verified_at && (
                  <div className="pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Terakhir diverifikasi:{" "}
                      {format(
                        new Date(card.last_verified_at),
                        "dd MMM yyyy, HH:mm",
                        { locale: id }
                      )}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="print:hidden">
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex flex-col items-center gap-1"
                    onClick={handleRegenerate}
                    disabled={regenerateCard.isPending}
                  >
                    {regenerateCard.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-5 w-5" />
                    )}
                    <span className="text-xs">Generate Ulang</span>
                  </Button>
                  <Link to={`/verify/${card.verification_code}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex flex-col items-center gap-1 w-full"
                    >
                      <Eye className="h-5 w-5" />
                      <span className="text-xs">Lihat Verifikasi</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Info */}
            <div className="bg-muted/50 rounded-xl p-4 print:hidden">
              <div className="flex items-start gap-3">
                <QrCode className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Cara Verifikasi</p>
                  <p className="text-muted-foreground text-xs">
                    Panitia atau pihak terkait dapat scan QR Code pada ID Card
                    Anda untuk memverifikasi keabsahan status wasit.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <RefereeNav />
    </div>
  );
}
