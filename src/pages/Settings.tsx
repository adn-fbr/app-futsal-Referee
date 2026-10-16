import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Save, Mail, Building2, Loader2, Send, CheckCircle2, AlertCircle, IdCard, Users, RefreshCw, ExternalLink, MessageSquareMore } from "lucide-react";
import { useSettingsMap, useBulkUpdateSettings } from "@/hooks/useSettings";
import { useAllRefereeCards, useRevokeCard, useRenewCard } from "@/hooks/useRefereeCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { validateBulkSettings } from "@/lib/settingsValidation";
import { resolveWhatsAppProvider, type WhatsAppProvider } from "@/lib/whatsappProvider";

type SettingPayload = { key: string; value: string };

function validatePayload(settings: SettingPayload[]) {
  const result = validateBulkSettings(settings);
  if (!result.ok) {
    toast.error(result.error);
    return null;
  }

  return result.normalized;
}

export default function Settings() {
  const { settingsMap, isLoading } = useSettingsMap();
  const updateSettings = useBulkUpdateSettings();

  // Public-safe settings only
  const [emailProvider, setEmailProvider] = useState("resend");
  const [whatsappProvider, setWhatsappProvider] = useState<WhatsAppProvider>("meta");

  // Email sender settings
  const [associationEmail, setAssociationEmail] = useState("");
  const [senderEmailName, setSenderEmailName] = useState("");
  const [senderEmailAddress, setSenderEmailAddress] = useState("");

  // Test email state
  const [testEmail, setTestEmail] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [whatsappRecipient, setWhatsappRecipient] = useState("");
  const [isSendingWhatsappTest, setIsSendingWhatsappTest] = useState(false);

  // Organization settings state
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgEmail, setOrgEmail] = useState("");

  // Track if initial hydration has been done
  const didInit = useRef(false);

  // Sync state with fetched data - only on first load
  useEffect(() => {
    if (settingsMap && !didInit.current) {
      didInit.current = true;
      setEmailProvider(settingsMap.email_provider || "resend");
      setWhatsappProvider(resolveWhatsAppProvider(settingsMap.whatsapp_provider));
      setAssociationEmail(settingsMap.association_email || "");
      setSenderEmailName(settingsMap.sender_email_name || "");
      setSenderEmailAddress(settingsMap.sender_email_address || "");
      setOrgName(settingsMap.organization_name || "");
      setOrgPhone(settingsMap.organization_phone || "");
      setOrgAddress(settingsMap.organization_address || "");
      setOrgEmail(settingsMap.organization_email || "");
    }
  }, [settingsMap]);

  const handleSaveEmailSettings = () => {
    const settings = validatePayload([
      { key: "email_provider", value: emailProvider },
      { key: "association_email", value: associationEmail },
      { key: "sender_email_name", value: senderEmailName },
      { key: "sender_email_address", value: senderEmailAddress },
      { key: "whatsapp_provider", value: whatsappProvider },
    ]);
    if (settings) updateSettings.mutate(settings);
  };

  const handleSaveOrgSettings = () => {
    const settings = [
      { key: "organization_name", value: orgName },
      { key: "organization_phone", value: orgPhone },
      { key: "organization_address", value: orgAddress },
      { key: "organization_email", value: orgEmail },
    ].filter(({ value }) => value.trim());
    const validatedSettings = validatePayload(settings);
    if (validatedSettings) updateSettings.mutate(validatedSettings);
  };

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error("Masukkan alamat email untuk test");
      return;
    }

    setIsSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("test-email-config", {
        body: { testEmail },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Email test berhasil dikirim!");
      } else {
        toast.error(data?.error || "Gagal mengirim email test");
      }
    } catch (error: unknown) {
      console.error("Test email error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengirim email test");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendTestWhatsapp = async () => {
    const recipient = whatsappRecipient.trim();
    if (!recipient) {
      toast.error("Masukkan nomor WhatsApp untuk test");
      return;
    }

    setIsSendingWhatsappTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          to: recipient,
          type: "template",
          template: { name: "hello_world", language: "en_US", parameters: [] },
        },
      });

      if (error) throw error;
      if (data?.success) {
        toast.success(`Pesan WhatsApp terkirim (${data.message_id})`);
      } else {
        toast.error(data?.error || "Pesan WhatsApp gagal dikirim");
      }
    } catch (error: unknown) {
      console.error("WhatsApp test error:", error);
      toast.error(error instanceof Error ? error.message : "Pesan WhatsApp gagal dikirim");
    } finally {
      setIsSendingWhatsappTest(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground">
            Kelola konfigurasi sistem dan organisasi
          </p>
        </div>

        <Tabs defaultValue="email" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organisasi
            </TabsTrigger>
            <TabsTrigger value="idcard" className="gap-2">
              <IdCard className="h-4 w-4" />
              ID Card
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {/* Email Provider Card */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Email</CardTitle>
                <CardDescription>
                  Pilih dan konfigurasi provider untuk mengirim email notifikasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEmailProvider("resend")}
                    className={`flex flex-col items-center justify-between rounded-md border-2 p-4 transition-colors ${
                      emailProvider === "resend"
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span className="text-lg font-semibold">Resend API</span>
                    <span className="text-xs text-muted-foreground mt-1">Recommended</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailProvider("smtp")}
                    className={`flex flex-col items-center justify-between rounded-md border-2 p-4 transition-colors ${
                      emailProvider === "smtp"
                        ? "border-primary bg-primary/5"
                        : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <span className="text-lg font-semibold">SMTP</span>
                    <span className="text-xs text-muted-foreground mt-1">Custom Server</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 border-t pt-4 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Credential provider email dikelola secara aman di server dan tidak dapat diakses dari browser.</span>
                </div>
              </CardContent>
            </Card>

            {/* Sender Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Pengirim</CardTitle>
                <CardDescription>
                  Konfigurasi identitas pengirim dan penerima notifikasi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sender_name">Nama Pengirim</Label>
                    <Input
                      id="sender_name"
                      placeholder="AFP Sulsel"
                      value={senderEmailName}
                      onChange={(e) => setSenderEmailName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sender_address">Alamat Email Pengirim</Label>
                    <Input
                      id="sender_address"
                      type="email"
                      placeholder="noreply@afpsulsel.org"
                      value={senderEmailAddress}
                      onChange={(e) => setSenderEmailAddress(e.target.value)}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {emailProvider === "resend" 
                    ? "Alamat email harus menggunakan domain yang terverifikasi di Resend"
                    : "Pastikan alamat email sesuai dengan konfigurasi SMTP server"}
                </p>

                <div className="space-y-2">
                  <Label htmlFor="association_email">Email Penerima Notifikasi</Label>
                  <Input
                    id="association_email"
                    type="email"
                    placeholder="email@example.com"
                    value={associationEmail}
                    onChange={(e) => setAssociationEmail(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Email ini akan menerima notifikasi pengajuan event baru
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Test Email Card */}
            <Card>
              <CardHeader>
                <CardTitle>Test Konfigurasi</CardTitle>
                <CardDescription>
                  Kirim email test untuk memastikan konfigurasi benar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="Alamat email untuk test..."
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSendTestEmail}
                    disabled={isSendingTest || !testEmail}
                  >
                    {isSendingTest ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Kirim Test
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Simpan pengaturan terlebih dahulu sebelum mengirim email test
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Test WhatsApp</CardTitle>
                <CardDescription>
                  Provider aktif: {whatsappProvider === "meta" ? "Meta WhatsApp Cloud API" : "Kirisan"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      type="tel"
                      placeholder="6281234567890"
                      value={whatsappRecipient}
                      onChange={(e) => setWhatsappRecipient(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleSendTestWhatsapp}
                    disabled={isSendingWhatsappTest || !whatsappRecipient.trim()}
                  >
                    {isSendingWhatsappTest ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquareMore className="h-4 w-4 mr-2" />
                    )}
                    Kirim Test
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Credential WhatsApp dikelola di server. Kirisan outbound masih menunggu kontrak /v1/send yang terverifikasi.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>WhatsApp Provider</CardTitle>
                <CardDescription>Pilih provider aktif tanpa mengubah konfigurasi provider lainnya.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setWhatsappProvider("meta")}
                  aria-pressed={whatsappProvider === "meta"}
                  className={`rounded-md border-2 p-4 text-left transition-colors ${whatsappProvider === "meta" ? "border-primary bg-primary/5" : "border-muted bg-popover hover:bg-accent"}`}
                >
                  <span className="font-semibold">Meta WhatsApp Cloud API</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Existing Cloud API integration</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsappProvider("kirisan")}
                  aria-pressed={whatsappProvider === "kirisan"}
                  className={`rounded-md border-2 p-4 text-left transition-colors ${whatsappProvider === "kirisan" ? "border-primary bg-primary/5" : "border-muted bg-popover hover:bg-accent"}`}
                >
                  <span className="font-semibold">Kirisan</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Outbound contract open</span>
                </button>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                onClick={handleSaveEmailSettings}
                disabled={updateSettings.isPending}
                size="lg"
              >
                {updateSettings.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Simpan Pengaturan Email
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="organization">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Organisasi</CardTitle>
                <CardDescription>
                  Data organisasi yang ditampilkan di halaman publik
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org_name">Nama Organisasi</Label>
                  <Input
                    id="org_name"
                    placeholder="Asosiasi Futsal Provinsi Sulawesi Selatan"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_email">Email Publik</Label>
                  <Input
                    id="org_email"
                    type="email"
                    placeholder="info@afpsulsel.org"
                    value={orgEmail}
                    onChange={(e) => setOrgEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_phone">Nomor Telepon</Label>
                  <Input
                    id="org_phone"
                    placeholder="(0411) 123-4567"
                    value={orgPhone}
                    onChange={(e) => setOrgPhone(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="org_address">Alamat</Label>
                  <Textarea
                    id="org_address"
                    placeholder="Jl. Perintis Kemerdekaan KM 12, Makassar"
                    value={orgAddress}
                    onChange={(e) => setOrgAddress(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleSaveOrgSettings}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Simpan Informasi Organisasi
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="idcard">
            <IDCardManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

// ID Card Management Component
function IDCardManagement() {
  const navigate = useNavigate();
  const { data: allCards, isLoading } = useAllRefereeCards();
  const revokeCard = useRevokeCard();
  const renewCard = useRenewCard();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredCards = allCards?.filter((card) => {
    const matchesSearch = 
      card.card_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.referee?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || card.status === filterStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const stats = {
    total: allCards?.length || 0,
    active: allCards?.filter(c => c.status === "active").length || 0,
    expired: allCards?.filter(c => c.status === "expired").length || 0,
    revoked: allCards?.filter(c => c.status === "revoked").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-success text-success-foreground">Aktif</Badge>;
      case "expired":
        return <Badge variant="secondary">Kadaluarsa</Badge>;
      case "revoked":
        return <Badge variant="destructive">Dicabut</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleRevoke = (cardId: string, refereeName: string) => {
    if (confirm(`Yakin ingin mencabut ID Card untuk ${refereeName}?`)) {
      revokeCard.mutate(cardId);
    }
  };

  const handleRenew = (cardId: string) => {
    renewCard.mutate(cardId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total ID Card</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-success/20">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold text-success">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Aktif</p>
          </CardContent>
        </Card>
        <Card className="bg-warning/10 border-warning/20">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-warning" />
            <p className="text-2xl font-bold text-warning">{stats.expired}</p>
            <p className="text-xs text-muted-foreground">Kadaluarsa</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-5 w-5 mx-auto mb-1 text-destructive" />
            <p className="text-2xl font-bold text-destructive">{stats.revoked}</p>
            <p className="text-xs text-muted-foreground">Dicabut</p>
          </CardContent>
        </Card>
      </div>

      {/* Management Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Manajemen ID Card Wasit</CardTitle>
              <CardDescription>
                Kelola, perpanjang, dan cabut ID Card wasit
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/admin/id-cards")}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Cari nama wasit atau nomor kartu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Semua
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("active")}
              >
                Aktif
              </Button>
              <Button
                variant={filterStatus === "expired" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("expired")}
              >
                Kadaluarsa
              </Button>
            </div>
          </div>

          {/* Card List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredCards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IdCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Tidak ada ID Card ditemukan</p>
              </div>
            ) : (
              filteredCards.slice(0, 10).map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{card.referee?.full_name || "Unknown"}</p>
                      {getStatusBadge(card.status)}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono">{card.card_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Berlaku: {card.expires_at ? format(new Date(card.expires_at), "d MMM yyyy", { locale: localeId }) : "-"}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    {card.status === "expired" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRenew(card.id)}
                        disabled={renewCard.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Perpanjang
                      </Button>
                    )}
                    {card.status === "active" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevoke(card.id, card.referee?.full_name || "wasit")}
                        disabled={revokeCard.isPending}
                      >
                        Cabut
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            {filteredCards.length > 10 && (
              <p className="text-center text-sm text-muted-foreground py-2">
                Dan {filteredCards.length - 10} kartu lainnya...{" "}
                <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/admin/id-cards")}>
                  Lihat semua
                </Button>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
