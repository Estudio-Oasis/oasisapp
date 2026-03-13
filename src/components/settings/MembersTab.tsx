import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";

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

export function MembersTab({ agencyId, isAdmin, allowedDomain }: Props) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !user) return;
    setInviting(true);

    const { data, error } = await supabase.functions.invoke("invite-member", {
      body: { email: inviteEmail.trim().toLowerCase() },
    });

    if (error) {
      toast.error("Failed to send invitation");
    } else if (data?.error) {
      if (data.error.includes("already") || data.error.includes("duplicate")) {
        toast.error("Invitation already sent to this email");
      } else {
        toast.error(data.error);
      }
    } else {
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      fetchData();
    }
    setInviting(false);
  };

  const handleCancelInvite = async (id: string) => {
    await supabase.from("agency_invitations").delete().eq("id", id);
    toast.success("Invitation cancelled");
    fetchData();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (memberId === user?.id) {
      toast.error("You can't remove yourself");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ agency_id: null })
      .eq("id", memberId);
    if (error) {
      toast.error("Failed to remove member");
      return;
    }
    toast.success("Member removed");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-foreground-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite */}
      {isAdmin && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-h3 text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite a team member
          </h3>
          {allowedDomain && (
            <p className="text-xs text-foreground-muted mt-1">
              Users with @{allowedDomain} emails will auto-join on signup
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Input
              placeholder="colleague@company.com"
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
                  Invite
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-label">Pending invitations</h3>
          {invitations.map((inv) => (
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
                    Invited · {inv.role}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  className="text-foreground-muted hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2">
        <h3 className="text-label">Team members ({members.length})</h3>
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
                    <span className="text-foreground-muted ml-1">(you)</span>
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
