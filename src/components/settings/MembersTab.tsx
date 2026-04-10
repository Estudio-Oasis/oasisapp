import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Mail, RefreshCw, Trash2, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

interface Member {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  avatar_url: string | null;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Props {
  agencyId: string;
  isAdmin: boolean;
  allowedDomain: string | null;
}

const COOLDOWN_MS = 15_000;

export function MembersTab({ agencyId, isAdmin, allowedDomain }: Props) {
  const { user } = useAuth();
  const { maxMembers, isFree } = usePlan();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const cooldownTimers = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(cooldownTimers.current).forEach(clearInterval);
    };
  }, []);

  const startCooldown = useCallback((key: string, seconds: number) => {
    setCooldowns((prev) => ({ ...prev, [key]: seconds }));
    if (cooldownTimers.current[key]) clearInterval(cooldownTimers.current[key]);
    cooldownTimers.current[key] = setInterval(() => {
      setCooldowns((prev) => {
        const remaining = (prev[key] || 0) - 1;
        if (remaining <= 0) {
          clearInterval(cooldownTimers.current[key]);
          delete cooldownTimers.current[key];
          const { [key]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [key]: remaining };
      });
    }, 1000);
  }, []);

  const fetchData = useCallback(async () => {
    const [membersRes, invitesRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, name, email, role, avatar_url")
        .eq("agency_id", agencyId),
      supabase
        .from("agency_invitations")
        .select("*")
        .eq("agency_id", agencyId)
        .eq("status", "pending"),
    ]);

    if (membersRes.data) setMembers(membersRes.data);
    if (invitesRes.data) setInvitations(invitesRes.data as Invitation[]);
    setLoading(false);
  }, [agencyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInviteResponse = (data: any, error: any, email: string, cooldownKey: string): boolean => {
    if (error) {
      toast.error("No se pudo enviar la invitación");
      return false;
    }
    if (data?.code === "rate_limited") {
      const secs = data.retry_after_seconds || 10;
      startCooldown(cooldownKey, secs);
      toast.error(`Demasiados intentos. Intenta en ${secs} segundos.`);
      return false;
    }
    if (data?.error) {
      if (data.error.includes("already") || data.error.includes("duplicate")) {
        toast.error("Ya se envió una invitación a este correo");
      } else {
        toast.error(data.error);
      }
      return false;
    }
    return true;
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    const email = inviteEmail.trim().toLowerCase();
    if (cooldowns[`invite_${email}`]) return;

    setInviting(true);
    const { data, error } = await supabase.functions.invoke("invite-member", {
      body: { email },
    });

    if (handleInviteResponse(data, error, email, `invite_${email}`)) {
      toast.success(`Invitación enviada a ${email}`);
      setInviteEmail("");
      startCooldown(`invite_${email}`, Math.round(COOLDOWN_MS / 1000));
      fetchData();
    }
    setInviting(false);
  };

  const handleCancelInvite = async (id: string) => {
    await supabase.from("agency_invitations").delete().eq("id", id);
    toast.success("Invitación cancelada");
    fetchData();
  };

  const handleResendInvite = async (inv: Invitation) => {
    if (cooldowns[inv.id]) return;
    setResendingId(inv.id);

    const { data, error } = await supabase.functions.invoke("invite-member", {
      body: { email: inv.email },
    });

    if (handleInviteResponse(data, error, inv.email, inv.id)) {
      toast.success(`Invitación reenviada a ${inv.email}`);
      startCooldown(inv.id, Math.round(COOLDOWN_MS / 1000));
    }
    setResendingId(null);
    fetchData();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === user?.id) {
      toast.error("No puedes eliminarte a ti mismo");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ agency_id: null })
      .eq("id", memberId);
    if (error) {
      toast.error("No se pudo eliminar al miembro");
      return;
    }
    toast.success("Miembro eliminado");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  const memberCount = members.length + invitations.length;
  const canInvite = memberCount < maxMembers;

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole as "admin" | "member" | "user" })
      .eq("id", memberId)
      .eq("agency_id", agencyId);
    if (error) {
      toast.error("Error al cambiar rol");
    } else {
      toast.success("Rol actualizado");
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Invite */}
      {isAdmin && !canInvite && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Límite de {maxMembers} {maxMembers === 1 ? "usuario" : "usuarios"} alcanzado
          </p>
          <p className="text-amber-700 dark:text-amber-300 mt-1">
            Tu plan {isFree ? "Gratis" : "actual"} permite hasta {maxMembers} {maxMembers === 1 ? "usuario" : "usuarios"}.
          </p>
          <Link to="/pricing" className="mt-2 inline-flex items-center gap-1 text-amber-800 dark:text-amber-200 font-medium hover:underline text-xs">
            Mejorar plan para agregar más colaboradores →
          </Link>
        </div>
      )}
      {isAdmin && canInvite && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-h3 text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invitar a un miembro del equipo
          </h3>
          {allowedDomain && (
            <p className="text-xs text-foreground-muted mt-1">
              Los usuarios con correos @{allowedDomain} se unen automáticamente al registrarse
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="colega@empresa.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
              className="flex-1"
            />
            <Button
              onClick={handleInvite}
              disabled={!inviteEmail.trim() || inviting}
              size="sm"
            >
              {inviting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Invitar
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-label">Invitaciones pendientes</h3>
          {invitations.map((inv) => {
            const cd = cooldowns[inv.id];
            return (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-light text-xs font-semibold">
                    ✉️
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.email}</p>
                    <p className="text-xs text-foreground-muted">
                      Invitado · {inv.role}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleResendInvite(inv)}
                      disabled={resendingId === inv.id || !!cd}
                      className="text-foreground-muted hover:text-foreground transition-colors disabled:opacity-40"
                      title={cd ? `Espera ${cd}s` : "Reenviar invitación"}
                    >
                      {resendingId === inv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : cd ? (
                        <span className="text-xs tabular-nums w-6 text-center">{cd}s</span>
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCancelInvite(inv.id)}
                      className="text-foreground-muted hover:text-destructive transition-colors"
                      title="Cancelar invitación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        <h3 className="text-label">Miembros del equipo ({members.length})</h3>
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background-tertiary text-xs font-semibold text-foreground-secondary">
                {(member.name || member.email || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.name || member.email}
                  {member.id === user?.id && (
                    <span className="text-foreground-muted ml-1">(tú)</span>
                  )}
                </p>
                <p className="text-xs text-foreground-muted">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={member.role === "admin" ? "default" : "secondary"}
                className="text-xs"
              >
                {member.role}
              </Badge>
              {isAdmin && member.id !== user?.id && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="text-foreground-muted hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
