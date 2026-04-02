import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Loader2, Users, Sun, Moon, Monitor, UserPlus, Clock, RotateCw, X, Camera, Briefcase } from "lucide-react";
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

export function ProfileSheet({ open, onOpenChange, profile, onProfileUpdated, onSignOut }: ProfileSheetProps) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile.name);
  const [jobTitle, setJobTitle] = useState(profile.job_title || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [workStartHour, setWorkStartHour] = useState(9);
  const [workStartMinute, setWorkStartMinute] = useState(0);
  const [workEndHour, setWorkEndHour] = useState(18);
  const [workEndMinute, setWorkEndMinute] = useState(0);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile.name);
    setJobTitle(profile.job_title || "");
    setAvatarUrl(profile.avatar_url || null);
  }, [profile]);

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

  useEffect(() => {
    if (open && isAdmin) {
      loadTeamData();
    }
  }, [open, isAdmin]);

  // Load work schedule and job_title
  useEffect(() => {
    if (open && user) {
      supabase
        .from("profiles")
        .select("work_start_hour, work_start_minute, work_end_hour, work_end_minute, job_title, avatar_url")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setWorkStartHour((data as any).work_start_hour ?? 9);
            setWorkStartMinute((data as any).work_start_minute ?? 0);
            setWorkEndHour((data as any).work_end_hour ?? 18);
            setWorkEndMinute((data as any).work_end_minute ?? 0);
            setJobTitle((data as any).job_title || "");
            if ((data as any).avatar_url) setAvatarUrl((data as any).avatar_url);
          }
        });
    }
  }, [open, user]);

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

  const handleSaveSchedule = async () => {
    if (!user) return;
    setSavingSchedule(true);
    const { error } = await supabase
      .from("profiles")
      .update({ work_start_hour: workStartHour, work_start_minute: workStartMinute, work_end_hour: workEndHour, work_end_minute: workEndMinute } as any)
      .eq("id", user.id);
    setSavingSchedule(false);
    if (error) {
      toast.error("Error al guardar horario");
    } else {
      toast.success("Horario actualizado");
    }
  };

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), job_title: jobTitle.trim() || null })
      .eq("id", user.id);
    setSavingName(false);
    if (error) {
      toast.error("No se pudo actualizar");
    } else {
      toast.success("Perfil actualizado");
      onProfileUpdated({ name: name.trim(), job_title: jobTitle.trim() || null, avatar_url: avatarUrl });
    }
  };

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

  const toggleRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "member" : "admin";
    setTogglingId(memberId);
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", memberId);
    setTogglingId(null);
    if (error) {
      toast.error("No se pudo actualizar el rol");
    } else {
      setTeam((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole as TeamMember["role"] } : m))
      );
      toast.success(`Rol actualizado a ${newRole}`);
    }
  };

  const handleResendInvite = async (invite: PendingInvite) => {
    setResendingId(invite.id);
    const { error } = await supabase.functions.invoke("invite-member", {
      body: { email: invite.email, full_name: invite.full_name },
    });
    setResendingId(null);
    if (error) {
      toast.error("Error al reenviar");
    } else {
      toast.success(`Invitación reenviada a ${invite.email}`);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    const { error } = await supabase
      .from("agency_invitations")
      .delete()
      .eq("id", inviteId);
    setCancellingId(null);
    if (error) {
      toast.error("Error al cancelar");
    } else {
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast.success("Invitación cancelada");
    }
  };

  const displayInitials = name.charAt(0).toUpperCase();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[340px] sm:w-[380px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Mi perfil</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Avatar + role */}
            <div className="flex items-center gap-3">
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
              <div>
                <p className="text-sm font-medium text-foreground">{name}</p>
                {jobTitle && <p className="text-[12px] text-foreground-secondary">{jobTitle}</p>}
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${profile.role === "admin" ? "text-accent" : "text-foreground-muted"}`}>
                  {profile.role}
                </span>
              </div>
            </div>

            {/* Edit name + job title */}
            <div className="space-y-2">
              <div className="space-y-1.5">
                <label className="text-label">Nombre completo</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-label">Rol / Puesto</label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Ej: Diseñador, Project Manager..."
                />
              </div>
              <Button size="sm" onClick={handleSaveName} disabled={savingName || (name.trim() === profile.name && jobTitle.trim() === (profile.job_title || ""))}>
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>

            {/* Change password */}
            <div className="space-y-1.5">
              <label className="text-label">Nueva contraseña</label>
              <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <label className="text-label">Confirmar contraseña</label>
              <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <Button size="sm" variant="secondary" onClick={handleChangePassword} disabled={savingPassword || !newPassword} className="mt-1">
                {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar contraseña"}
              </Button>
            </div>

            {/* Team management — admin only */}
            {isAdmin && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-foreground-muted" />
                    <label className="text-label">Equipo</label>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setInviteModalOpen(true)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Invitar
                  </Button>
                </div>

                {/* Pending invitations */}
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

                {/* Active members */}
                {team.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                    {team.map((m) => {
                      const isCurrentUser = m.id === user?.id;
                      const displayName = m.name || m.email?.split("@")[0] || "User";
                      return (
                        <div key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-background-secondary">
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
                              {togglingId === m.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                m.role
                              )}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Work schedule */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-foreground-muted" />
                <label className="text-label">Horario de trabajo</label>
              </div>
              <p className="text-xs text-foreground-muted">
                Rango de tu jornada laboral (para detección de tiempo sin registrar)
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted w-12">Inicio</span>
                  <select value={workStartHour} onChange={(e) => setWorkStartHour(Number(e.target.value))} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                    {Array.from({ length: 24 }, (_, i) => (<option key={i} value={i}>{String(i).padStart(2, "0")}</option>))}
                  </select>
                  <span className="text-foreground-muted font-medium">:</span>
                  <select value={workStartMinute} onChange={(e) => setWorkStartMinute(Number(e.target.value))} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                    {[0, 15, 30, 45].map((m) => (<option key={m} value={m}>{String(m).padStart(2, "0")}</option>))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-foreground-muted w-12">Fin</span>
                  <select value={workEndHour} onChange={(e) => setWorkEndHour(Number(e.target.value))} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                    {Array.from({ length: 24 }, (_, i) => (<option key={i} value={i}>{String(i).padStart(2, "0")}</option>))}
                  </select>
                  <span className="text-foreground-muted font-medium">:</span>
                  <select value={workEndMinute} onChange={(e) => setWorkEndMinute(Number(e.target.value))} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground">
                    {[0, 15, 30, 45].map((m) => (<option key={m} value={m}>{String(m).padStart(2, "0")}</option>))}
                  </select>
                </div>
              </div>
              <Button size="sm" onClick={handleSaveSchedule} disabled={savingSchedule}>
                {savingSchedule ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar horario"}
              </Button>
            </div>

            {/* Theme */}
            <div className="space-y-1.5">
              <label className="text-label">Tema</label>
              <div className="flex gap-2">
                {([
                  { value: "light", icon: Sun, label: "Claro" },
                  { value: "dark", icon: Moon, label: "Oscuro" },
                  { value: "system", icon: Monitor, label: "Sistema" },
                ] as const).map(({ value, icon: Icon, label }) => (
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
            </div>

            {/* Sign out */}
            <Button
              variant="ghost"
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
              onClick={onSignOut}
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onInvited={() => loadTeamData()}
      />
    </>
  );
}
