import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Bell, Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRefereeContact } from "@/hooks/useRefereeContact";
import { useState } from "react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  NOTIFICATION_TYPE_LABELS,
  NotificationType,
} from "@/hooks/useNotificationPreferences";

const NOTIFICATION_TYPES: NotificationType[] = [
  "honor",
  "assignment",
  "evaluation",
  "registration",
  "discussion",
  "learning",
  "pengurus",
  "event",
];

export const NotificationPreferences = () => {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const { user } = useAuth();
  const { data: refereeContact } = useRefereeContact();
  const [savingType, setSavingType] = useState<NotificationType | null>(null);
  const [saveError, setSaveError] = useState(false);

  const handleToggle = async (type: NotificationType, enabled: boolean) => {
    const key = `${type}_enabled`;
    setSavingType(type);
    setSaveError(false);
    try {
      await updatePreferences.mutateAsync({ [key]: enabled });
    } catch {
      setSaveError(true);
    } finally {
      setSavingType(null);
    }
  };

  const getPreferenceValue = (type: NotificationType): boolean => {
    if (!preferences) return true;
    const key = `${type}_enabled` as keyof typeof preferences;
    const value = preferences[key];
    return value !== false;
  };

  const maskedWhatsapp = refereeContact?.whatsapp_number
    ? `${refereeContact.whatsapp_number.slice(0, 4)}••••••${refereeContact.whatsapp_number.slice(-2)}`
    : null;

  const focusWhatsappField = () => {
    const field = document.getElementById("whatsapp-number");
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
    field?.focus();
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-6 w-11 shrink-0" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
            Preferensi Notifikasi
          </CardTitle>
          <CardDescription className="mt-2 max-w-2xl">
            Atur bagaimana Anda menerima pemberitahuan penugasan dan informasi penting dari AFP Sulsel Referee.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-medium">Email</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Terima pemberitahuan penugasan dan informasi penting melalui email.
                </p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Email terdaftar</p>
                {user?.email ? (
                  <a className="mt-1 block truncate text-sm text-primary underline-offset-4 hover:underline" href={`mailto:${user.email}`}>
                    {user.email}
                  </a>
                ) : (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300">
                    <AlertCircle className="h-4 w-4" aria-hidden="true" />
                    Email belum tersedia.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">WhatsApp</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Terima pemberitahuan penugasan dan informasi penting melalui WhatsApp.
                </p>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Nomor WhatsApp</p>
                {maskedWhatsapp ? (
                  <p className="mt-1 text-sm font-medium">{maskedWhatsapp}</p>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-300">
                      <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      Nomor WhatsApp belum terdaftar.
                    </p>
                    <Button type="button" variant="link" className="h-auto p-0 text-sm" onClick={focusWhatsappField}>
                      Tambahkan Nomor WhatsApp
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="border-b pb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Jenis notifikasi</p>
            <p className="mt-1 text-sm text-muted-foreground">Pilih informasi yang ingin Anda terima melalui saluran yang tersedia.</p>
          </div>

          {saveError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Preferensi gagal disimpan. Periksa koneksi Anda dan coba lagi.</span>
            </div>
          )}

          <div className="divide-y">
            {NOTIFICATION_TYPES.map((type) => {
              const { label, description } = NOTIFICATION_TYPE_LABELS[type];
              const enabled = getPreferenceValue(type);
              const isSaving = savingType === type;

              return (
                <div key={type} className="flex min-h-[64px] items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 pr-2">
                    <Label htmlFor={`pref-${type}`} className="cursor-pointer text-sm font-semibold">
                      {label}
                    </Label>
                    <p className="mt-0.5 text-xs leading-4 text-muted-foreground sm:text-sm">{description}</p>
                  </div>
                  <Switch
                    id={`pref-${type}`}
                    aria-label={`${label}: ${enabled ? "Aktif" : "Nonaktif"}${isSaving ? ", Menyimpan" : ""}`}
                    aria-busy={isSaving}
                    checked={enabled}
                    onCheckedChange={(checked) => handleToggle(type, checked)}
                    disabled={updatePreferences.isPending}
                    className="h-11 w-12 shrink-0 [&>span]:h-6 [&>span]:w-6 data-[state=checked]:[&>span]:translate-x-5"
                  />
                </div>
              );
            })}
          </div>
        </div>

      </CardContent>
    </Card>
  );
};
