import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  XCircle,
  Shield,
  Award,
  MapPin,
  Calendar,
  Loader2,
  Home,
  AlertTriangle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { useVerifyCard } from "@/hooks/useRefereeCard";
import { useVerifyOfficialDocument } from "@/hooks/useOfficialDocument";
import { formatLicenseLevel } from "@/lib/formatters";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import ffiLogo from "@/assets/ffi-logo.png";

export default function PublicVerification() {
  const { code } = useParams<{ code: string }>();
  const { data: cardResult, isLoading: cardLoading, error: cardError } = useVerifyCard(code || "");
  const { data: officialResult, isLoading: officialLoading, error: officialError } = useVerifyOfficialDocument(code || "");
  const isLoading = cardLoading || officialLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Memverifikasi dokumen dan kartu...</p>
      </div>
    );
  }

  if (cardResult?.valid && cardResult.card) {
    const card = cardResult.card;
    const referee = card.referee;

    return (
      <div className="min-h-screen bg-gradient-to-br from-success/5 to-background p-4">
        <div className="max-w-sm mx-auto pt-8 space-y-6">
          <div className="text-center">
            <img src={ffiLogo} alt="FFI Logo" className="h-12 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Federasi Futsal Indonesia - Sulawesi Selatan</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/10 mb-4 animate-pulse">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-success" />
              <h1 className="text-2xl font-bold text-success">TERVERIFIKASI</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Kartu wasit ini telah diverifikasi dan valid
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-6">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 mx-auto mb-3">
                  {referee?.profile_photo_url ? (
                    <img
                      src={referee.profile_photo_url}
                      alt={referee.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Award className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl font-bold">{referee?.full_name}</h2>
                <p className="text-sm text-muted-foreground">Wasit Futsal</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <StatusBadge status={referee?.is_active ? "success" : "error"}>
                    {referee?.is_active ? "Aktif" : "Non-Aktif"}
                  </StatusBadge>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Level Lisensi</p>
                    <p className="font-medium">{formatLicenseLevel(referee?.license_level)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Asal</p>
                    <p className="font-medium">{referee?.kabupaten_kota?.name || referee?.afk_origin || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Berlaku Sampai</p>
                    <p className="font-medium">{card.expires_at ? format(new Date(card.expires_at), "dd MMMM yyyy", { locale: id }) : "Tidak terbatas"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground mb-1">Nomor Kartu</p>
                <p className="font-mono text-sm font-medium">{card.card_number}</p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-xs text-muted-foreground">
            <p>Diverifikasi pada {format(new Date(), "dd MMMM yyyy, HH:mm", { locale: id })}</p>
          </div>
        </div>
      </div>
    );
  }

  if (officialResult?.valid && officialResult.document) {
    const document = officialResult.document;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-100 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-emerald-700 mb-2">DOCUMENT VALID</h1>
            <p className="text-sm text-muted-foreground mb-4">Dokumen resmi telah diterbitkan dan integritasnya tervalidasi.</p>
            <div className="space-y-2 text-left rounded-md bg-muted/40 p-4 text-sm">
              <p><strong>Document Number:</strong> {document.document_number}</p>
              <p><strong>Document Type:</strong> {document.document_type}</p>
              <p><strong>Status:</strong> {document.status}</p>
              <p><strong>Issued Date:</strong> {format(new Date(document.issued_at), "dd MMMM yyyy", { locale: id })}</p>
              <p><strong>Integrity:</strong> VALID</p>
            </div>
            <Link to="/" className="mt-6 block">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMessage = officialResult?.message || cardResult?.message || "Dokumen atau kartu tidak ditemukan.";
  const isRevoked = officialResult?.status === "revoked";

  if (cardError || officialError || (!cardResult && !officialResult)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 to-background p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-destructive mb-2">
              {isRevoked ? "Dokumen Dicabut" : "Verifikasi Gagal"}
            </h1>
            <p className="text-muted-foreground text-sm mb-6">{statusMessage}</p>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-destructive/5 to-background p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="pt-8 pb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-destructive mb-2">
            {officialResult?.status === "revoked" ? "Dokumen Dicabut" : "Tidak Valid"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">{statusMessage}</p>
          <Link to="/">
            <Button variant="outline" className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}


