import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LogOut, Loader2, Users, Sun, Moon, Monitor, UserPlus, Clock, RotateCw,
  X, Camera, Mail, Phone, ShieldAlert, Trash2, AlertTriangle, Info,
} from "lucide-react";
import { toast } from "sonner";
import { getClientColor } from "@/lib/timer-utils";
import { InviteMemberModal } from "@/components/InviteMemberModal";

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: { name: string; role: string; avatar_url?: string | null; job_title?: string | null };
  onProfileUpdated: (updated: { name: string; avatar_url?: string | null; job_title?: string | null }) => void;
  onSignOut: () => void;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: "admin" | "member" | "user";
}

interface PendingInvite {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: string;
}

interface NotificationPrefs {
  email_daily_summary: boolean;
  email_mentions: boolean;
  email_task_reminders: boolean;
  email_product_updates: boolean;
  inapp_sounds: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  email_daily_summary: true,
  email_mentions: true,
  email_task_reminders: true,
  email_product_updates: false,
  inapp_sounds: true,
};

const COMMON_TIMEZONES = [
  "America/Mexico_City",
  "America/Bogota",
  "America/Lima",
  "America/Santiago",
  "America/Buenos_Aires",
  "America/Sao_Paulo",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Madrid",
  "Europe/London",
  "UTC",
];

export function ProfileSheet({ open, onOpenChange, profile, onProfileUpdated, onSignOut }: ProfileSheetProps) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [tab, setTab] = useState<"account" | "preferences" | "team">("account");

  // ---------------- Account ----------------
  const [name, setName] = useState(profile.name);
  const [jobTitle, setJobTitle] = useState(profile.job_title || "");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [emailVerified, setEmailVerified] = useState(true);
  const [pendingNewEmail, setPendingNewEmail] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState<string | null>(null);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // ---------------- Preferences ----------------
  const [timezone, setTimezone] = useState("America/Mexico_City");
  const [weekStart, setWeekStart] = useState<0 | 1>(1);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [workStartHour, setWorkStartHour] = useState(9);
  const [workStartMinute, setWorkStartMinute] = useState(0);
  const [workEndHour, setWorkEndHour] = useState(18);
  const [workEndMinute, setWorkEndMinute] = useState(0);
  const [savingPrefs, setSavingPrefs] = useState(false);

  // ---------------- Team ----------------
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // ---------------- Avatar ----------------
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---------------- Danger ----------------
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);

  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setName(profile.name);
    setJobTitle(profile.job_title || "");
    setAvatarUrl(profile.avatar_url || null);
  }, [profile]);

  // Load full profile + auth metadata when opened
  useEffect(() => {
    if (!open || !user) return;

    setEmail(user.email ?? "");
    setEmailVerified(!!user.email_confirmed_at);
    setPendingNewEmail((user.new_email as string | undefined) ?? null);
    setCreatedAt(user.created_at ?? null);
    setLastSignIn(user.last_sign_in_at ?? null);

    supabase
      .from("profiles")
      .select(
        "name, job_title, avatar_url, phone, bio, timezone, week_start_day, notification_preferences, work_start_hour, work_start_minute, work_end_hour, work_end_minute, agency_id"
      )
      .eq("id", user.id)
      .maybeSingle()
      .then(async ({ data }) => {
        if (!data) return;
        const d = data as any;
        setName(d.name ?? "");
        setJobTitle(d.job_title ?? "");
        if (d.avatar_url) setAvatarUrl(d.avatar_url);
        setPhone(d.phone ?? "");
        setBio(d.bio ?? "");
        setTimezone(d.timezone ?? "America/Mexico_City");
        setWeekStart((d.week_start_day === 0 ? 0 : 1) as 0 | 1);
        setPrefs({ ...DEFAULT_PREFS, ...(d.notification_preferences ?? {}) });
        setWorkStartHour(d.work_start_hour ?? 9);
        setWorkStartMinute(d.work_start_minute ?? 0);
        setWorkEndHour(d.work_end_hour ?? 18);
        setWorkEndMinute(d.work_end_minute ?? 0);

        if (d.agency_id) {
          const { data: ag } = await supabase
            .from("agencies")
            .select("name")
            .eq("id", d.agency_id)
            .maybeSingle();
          setAgencyName(ag?.name ?? null);
        }
      });
  }, [open, user?.id]);

  useEffect(() => {
    if (open && isAdmin) loadTeamData();
  }, [open, isAdmin]);

  const loadTeamData = async () => {
    const [{ data: members }, { data: invites }] = await Promise.all([
      supabase.from("profiles").select("id, name, email, avatar_url, role").order("name"),
      supabase
        .from("agency_invitations")
        .select("id, email, full_name, status, created_at")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
    if (members) setTeam(members as TeamMember[]);
    if (invites) setPendingInvites(invites as PendingInvite[]);
  };

  // ---------------- Avatar upload ----------------
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen debe ser menor a 2MB");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);
      onProfileUpdated({ name, avatar_url: publicUrl, job_title: jobTitle });
      toast.success("Foto actualizada");
    } catch {
      toast.error("No se pudo subir la foto");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
    setUploadingAvatar(false);
    if (error) {
      toast.error("No se pudo quitar la foto");
    } else {
      setAvatarUrl(null);
      onProfileUpdated({ name, avatar_url: null, job_title: jobTitle });
      toast.success("Foto eliminada");
    }
  };

  // ---------------- Save profile (name, job, phone, bio) ----------------
  const handleSaveProfile = async () => {
    if (!user || !name.trim()) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        job_title: jobTitle.trim() || null,
        phone: phone.trim() || null,
        bio: bio.trim() || null,
      } as any)
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast.error("No se pudo actualizar");
    } else {
      toast.success("Perfil actualizado");
      onProfileUpdated({ name: name.trim(), job_title: jobTitle.trim() || null, avatar_url: avatarUrl });
    }
  };

  // ---------------- Email change ----------------
  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Email inválido");
      return;
    }
    if (trimmed === (user?.email ?? "").toLowerCase()) {
      toast.error("Es el mismo email actual");
      return;
    }
    setSavingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: trimmed });
    setSavingEmail(false);
    if (error) {
      toast.error(error.message);
    } else {
      setPendingNewEmail(trimmed);
      setEmailDialogOpen(false);
      setNewEmail("");
      toast.success("Te enviamos un correo de confirmación a tu nueva dirección");
    }
  };

  // ---------------- Password ----------------
  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // ---------------- Preferences save ----------------
  const handleSavePrefs = async () => {
    if (!user) return;
    setSavingPrefs(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        timezone,
        week_start_day: weekStart,
        notification_preferences: prefs,
        work_start_hour: workStartHour,
        work_start_minute: workStartMinute,
        work_end_hour: workEndHour,
        work_end_minute: workEndMinute,
      } as any)
      .eq("id", user.id);
    setSavingPrefs(false);
    if (error) toast.error("No se pudieron guardar las preferencias");
    else toast.success("Preferencias actualizadas");
  };

  // ---------------- Team ----------------
  const toggleRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    setTogglingId(memberId);
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", memberId);
    setTogglingId(null);
    if (error) toast.error("No se pudo actualizar el rol");
    else {
      setTeam((p) => p.map((m) => (m.id === memberId ? { ...m, role: newRole as TeamMember["role"] } : m)));
      toast.success(`Rol actualizado a ${newRole}`);
    }
  };

  const handleResendInvite = async (invite: PendingInvite) => {
    setResendingId(invite.id);
    const { error } = await supabase.functions.invoke("invite-member", {
      body: { email: invite.email, full_name: invite.full_name },
    });
    setResendingId(null);
    if (error) toast.error("Error al reenviar");
    else toast.success(`Invitación reenviada a ${invite.email}`);
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    const { error } = await supabase.from("agency_invitations").delete().eq("id", inviteId);
    setCancellingId(null);
    if (error) toast.error("Error al cancelar");
    else {
      setPendingInvites((p) => p.filter((i) => i.id !== inviteId));
      toast.success("Invitación cancelada");
    }
  };

  // ---------------- Danger ----------------
  const handleSignOutAll = async () => {
    setSigningOutAll(true);
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setSigningOutAll(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Sesión cerrada en todos los dispositivos");
      onSignOut();
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toLowerCase() !== (user?.email ?? "").toLowerCase()) {
      toast.error("Escribe tu email para confirmar");
      return;
    }
    setDeletingAccount(true);
    const { error } = await supabase.functions.invoke("delete-account", { body: {} });
    setDeletingAccount(false);
    if (error) {
      toast.error(error.message || "No se pudo eliminar la cuenta");
      return;
    }
    toast.success("Cuenta eliminada");
    setDeleteDialogOpen(false);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const displayInitials = (name || "U").charAt(0).toUpperCase();
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString(language === "en" ? "en-US" : "es-MX", { dateStyle: "medium" }) : "—";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
          <div className="px-6 pt-6 pb-3 border-b border-border">
            <SheetHeader>
              <SheetTitle>Mi perfil</SheetTitle>
            </SheetHeader>

            {/* Identity header */}
            <div className="mt-4 flex items-center gap-3">
              <div className="relative group">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-tertiary text-lg font-semibold text-foreground-secondary overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    displayInitials
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Cambiar foto"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{name}</p>
                {jobTitle && <p className="text-[12px] text-foreground-secondary truncate">{jobTitle}</p>}
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      profile.role === "admin" ? "text-accent" : "text-foreground-muted"
                    }`}
                  >
                    {profile.role}
                  </span>
                  {avatarUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      className="text-[11px] text-foreground-muted hover:text-destructive"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="account" className="flex-1">Cuenta</TabsTrigger>
              <TabsTrigger value="preferences" className="flex-1">Preferencias</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="team" className="flex-1">Equipo</TabsTrigger>
              )}
            </TabsList>

            {/* ============ CUENTA ============ */}
            <TabsContent value="account" className="mt-5 space-y-6">
              {/* Identity */}
              <section className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-label">Nombre completo</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label">Rol / Puesto</label>
                  <Input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Ej: Diseñador, Project Manager…"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-label flex items-center gap-1.5">
                      <Phone className="h-3 w-3" /> Teléfono
                    </label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+52 ..."
                      type="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label">Bio (max 280)</label>
                    <Textarea
                      value={bio}
                      maxLength={280}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Cuenta brevemente quién eres…"
                      rows={3}
                    />
                  </div>
                </div>
                <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
                </Button>
              </section>

              {/* Email */}
              <section className="space-y-2 border-t border-border pt-5">
                <div className="flex items-center justify-between">
                  <label className="text-label flex items-center gap-1.5">
                    <Mail className="h-3 w-3" /> Email
                  </label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setNewEmail("");
                      setEmailDialogOpen(true);
                    }}
                  >
                    Cambiar
                  </Button>
                </div>
                <div className="rounded-md border border-border bg-background-secondary px-3 py-2 text-sm text-foreground">
                  {email}
                  <span
                    className={`ml-2 text-[10px] font-semibold uppercase tracking-wider ${
                      emailVerified ? "text-accent" : "text-destructive"
                    }`}
                  >
                    {emailVerified ? "Verificado" : "Pendiente"}
                  </span>
                </div>
                {pendingNewEmail && (
                  <p className="text-[11px] text-foreground-muted flex items-center gap-1">
                    <Info className="h-3 w-3" /> Cambio pendiente a{" "}
                    <span className="font-medium text-foreground">{pendingNewEmail}</span> — confirma desde tu correo.
                  </p>
                )}
              </section>

              {/* Password */}
              <section className="space-y-1.5 border-t border-border pt-5">
                <label className="text-label">Cambiar contraseña</label>
                <Input
                  type="password"
                  placeholder="Nueva contraseña"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Confirmar"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword}
                  className="mt-1"
                >
                  {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar contraseña"}
                </Button>
              </section>

              {/* Account info */}
              <section className="space-y-2 border-t border-border pt-5 text-xs">
                <p className="text-label">Información de la cuenta</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-foreground-muted">
                  <span>Workspace</span>
                  <span className="text-foreground text-right truncate">{agencyName ?? "—"}</span>
                  <span>Cuenta creada</span>
                  <span className="text-foreground text-right">{fmtDate(createdAt)}</span>
                  <span>Último ingreso</span>
                  <span className="text-foreground text-right">{fmtDate(lastSignIn)}</span>
                  <span>ID</span>
                  <span className="text-foreground text-right font-mono text-[10px] truncate">
                    {user?.id?.slice(0, 8)}…
                  </span>
                </div>
              </section>

              {/* Danger zone */}
              <section className="space-y-2 border-t border-destructive/30 pt-5">
                <div className="flex items-center gap-1.5 text-destructive">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span className="text-label !text-destructive">Zona de peligro</span>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={onSignOut}
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOutAll}
                  disabled={signingOutAll}
                >
                  {signingOutAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Cerrar sesión en todos los dispositivos
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setDeleteConfirm("");
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Eliminar mi cuenta
                </Button>
              </section>

              <div className="h-6" />
            </TabsContent>

            {/* ============ PREFERENCIAS ============ */}
            <TabsContent value="preferences" className="mt-5 space-y-6">
              {/* Language */}
              <section className="space-y-1.5">
                <label className="text-label">Idioma</label>
                <div className="flex gap-2">
                  {(["es", "en"] as const).map((lng) => (
                    <Button
                      key={lng}
                      size="sm"
                      variant={language === lng ? "accent" : "secondary"}
                      className="flex-1"
                      onClick={() => setLanguage(lng)}
                    >
                      {lng === "es" ? "Español" : "English"}
                    </Button>
                  ))}
                </div>
              </section>

              {/* Theme */}
              <section className="space-y-1.5">
                <label className="text-label">Tema</label>
                <div className="flex gap-2">
                  {(
                    [
                      { value: "light", icon: Sun, label: "Claro" },
                      { value: "dark", icon: Moon, label: "Oscuro" },
                      { value: "system", icon: Monitor, label: "Sistema" },
                    ] as const
                  ).map(({ value, icon: Icon, label }) => (
                    <Button
                      key={value}
                      size="sm"
                      variant={theme === value ? "accent" : "secondary"}
                      className="flex-1 gap-1.5"
                      onClick={() => setTheme(value)}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </section>

              {/* Timezone */}
              <section className="space-y-1.5">
                <label className="text-label">Zona horaria</label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                    {detectedTz && !COMMON_TIMEZONES.includes(detectedTz) && (
                      <SelectItem value={detectedTz}>{detectedTz} (detectada)</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {detectedTz && detectedTz !== timezone && (
                  <button
                    onClick={() => setTimezone(detectedTz)}
                    className="text-[11px] text-accent hover:underline"
                  >
                    Usar la detectada: {detectedTz}
                  </button>
                )}
              </section>

              {/* Week start */}
              <section className="space-y-1.5">
                <label className="text-label">Inicio de semana</label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={weekStart === 1 ? "accent" : "secondary"}
                    className="flex-1"
                    onClick={() => setWeekStart(1)}
                  >
                    Lunes
                  </Button>
                  <Button
                    size="sm"
                    variant={weekStart === 0 ? "accent" : "secondary"}
                    className="flex-1"
                    onClick={() => setWeekStart(0)}
                  >
                    Domingo
                  </Button>
                </div>
              </section>

              {/* Work schedule */}
              <section className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-foreground-muted" />
                  <label className="text-label">Horario de trabajo</label>
                </div>
                <p className="text-xs text-foreground-muted">
                  Para detección de tiempo sin registrar.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground-muted w-12">Inicio</span>
                    <select
                      value={workStartHour}
                      onChange={(e) => setWorkStartHour(Number(e.target.value))}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="text-foreground-muted font-medium">:</span>
                    <select
                      value={workStartMinute}
                      onChange={(e) => setWorkStartMinute(Number(e.target.value))}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-foreground-muted w-12">Fin</span>
                    <select
                      value={workEndHour}
                      onChange={(e) => setWorkEndHour(Number(e.target.value))}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="text-foreground-muted font-medium">:</span>
                    <select
                      value={workEndMinute}
                      onChange={(e) => setWorkEndMinute(Number(e.target.value))}
                      className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
                    >
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section className="space-y-3">
                <label className="text-label">Notificaciones</label>
                {(
                  [
                    ["email_daily_summary", "Resumen diario por email"],
                    ["email_mentions", "Menciones en chat"],
                    ["email_task_reminders", "Recordatorios de tareas"],
                    ["email_product_updates", "Novedades del producto"],
                    ["inapp_sounds", "Sonidos en la app"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center justify-between text-sm text-foreground cursor-pointer"
                  >
                    <span>{label}</span>
                    <Switch
                      checked={prefs[key]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                    />
                  </label>
                ))}
              </section>

              <Button size="sm" onClick={handleSavePrefs} disabled={savingPrefs} className="w-full">
                {savingPrefs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar preferencias"}
              </Button>

              <div className="h-6" />
            </TabsContent>

            {/* ============ EQUIPO ============ */}
            {isAdmin && (
              <TabsContent value="team" className="mt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-foreground-muted" />
                    <label className="text-label">Equipo ({team.length})</label>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Invitar
                  </Button>
                </div>

                {pendingInvites.length > 0 && (
                  <div className="space-y-1">
                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center gap-2.5 px-2 py-1.5 rounded-md bg-accent-light/50"
                      >
                        <div className="h-7 w-7 rounded-full flex items-center justify-center bg-accent/20 shrink-0">
                          <Clock className="h-3.5 w-3.5 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">
                            {invite.full_name || invite.email.split("@")[0]}
                          </p>
                          <p className="text-[11px] text-foreground-muted truncate">{invite.email}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleResendInvite(invite)}
                            disabled={resendingId === invite.id}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-background-tertiary text-foreground-muted"
                            title="Reenviar"
                          >
                            {resendingId === invite.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RotateCw className="h-3 w-3" />
                            )}
                          </button>
                          <button
                            onClick={() => handleCancelInvite(invite.id)}
                            disabled={cancellingId === invite.id}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive-light text-foreground-muted hover:text-destructive"
                            title="Cancelar"
                          >
                            {cancellingId === invite.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {team.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-[420px] overflow-y-auto">
                    {team.map((m) => {
                      const isCurrentUser = m.id === user?.id;
                      const displayName = m.name || m.email?.split("@")[0] || "User";
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-background-secondary"
                        >
                          <div
                            className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 overflow-hidden"
                            style={m.avatar_url ? {} : { backgroundColor: getClientColor(displayName) }}
                          >
                            {m.avatar_url ? (
                              <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-background">{displayName.slice(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{displayName}</p>
                            <p className="text-[11px] text-foreground-muted truncate">{m.email}</p>
                          </div>
                          {isCurrentUser ? (
                            <span className="text-[11px] font-semibold text-foreground-muted uppercase">Tú</span>
                          ) : (
                            <button
                              onClick={() => toggleRole(m.id, m.role)}
                              disabled={togglingId === m.id}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                                m.role === "admin"
                                  ? "bg-accent-light text-accent-foreground hover:bg-accent/20"
                                  : "bg-background-tertiary text-foreground-muted hover:bg-background-secondary"
                              }`}
                            >
                              {togglingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : m.role}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="h-6" />
              </TabsContent>
            )}
          </Tabs>
        </SheetContent>
      </Sheet>

      <InviteMemberModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        onInvited={() => loadTeamData()}
      />

      {/* ----- Change email dialog ----- */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar email</DialogTitle>
            <DialogDescription>
              Te enviaremos un correo de confirmación a la nueva dirección. Tu sesión se mantiene activa.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-label">Nuevo email</label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="tu@nuevodominio.com"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEmailDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleChangeEmail} disabled={savingEmail || !newEmail}>
              {savingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar confirmación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ----- Delete account dialog ----- */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Eliminar cuenta
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong>permanente</strong>. Perderás acceso a este workspace y a todos tus datos
              personales. Si eres único admin, primero promueve a otro miembro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-label">
              Escribe <span className="font-mono text-destructive">{user?.email}</span> para confirmar
            </label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={user?.email ?? ""}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirm.trim().toLowerCase() !== (user?.email ?? "").toLowerCase()}
            >
              {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar permanentemente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
