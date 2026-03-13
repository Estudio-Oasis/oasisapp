import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import { useTheme } from "next-themes";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Loader2, Users, Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import { getClientColor } from "@/lib/timer-utils";

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: { name: string; role: string };
  onProfileUpdated: (updated: { name: string }) => void;
  onSignOut: () => void;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: "admin" | "member" | "user";
}

export function ProfileSheet({ open, onOpenChange, profile, onProfileUpdated, onSignOut }: ProfileSheetProps) {
  const { user } = useAuth();
  const { isAdmin } = useRole();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(profile.name);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (open && isAdmin) {
      supabase
        .from("profiles")
        .select("id, name, email, role")
        .order("name")
        .then(({ data }) => {
          if (data) setTeam(data as TeamMember[]);
        });
    }
  }, [open, isAdmin]);

  const handleSaveName = async () => {
    if (!user || !name.trim()) return;
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim() })
      .eq("id", user.id);
    setSavingName(false);
    if (error) {
      toast.error("Failed to update name");
    } else {
      toast.success("Name updated");
      onProfileUpdated({ name: name.trim() });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");
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
      toast.error("Failed to update role");
    } else {
      setTeam((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole as TeamMember["role"] } : m))
      );
      toast.success(`Role updated to ${newRole}`);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[340px] sm:w-[380px]">
        <SheetHeader>
          <SheetTitle>Profile</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Avatar + role */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-tertiary text-lg font-semibold text-foreground-secondary">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{profile.name}</p>
              <span className={`text-[11px] font-semibold uppercase tracking-wider ${profile.role === "admin" ? "text-accent" : "text-foreground-muted"}`}>
                {profile.role}
              </span>
            </div>
          </div>

          {/* Edit name */}
          <div className="space-y-1.5">
            <label className="text-label">Full name</label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Button size="sm" onClick={handleSaveName} disabled={savingName || name.trim() === profile.name}>
                {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>

          {/* Change password */}
          <div className="space-y-1.5">
            <label className="text-label">New password</label>
            <Input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <label className="text-label">Confirm password</label>
            <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <Button size="sm" variant="secondary" onClick={handleChangePassword} disabled={savingPassword || !newPassword} className="mt-1">
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change password"}
            </Button>
          </div>

          {/* Team management — admin only */}
          {isAdmin && team.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-foreground-muted" />
                <label className="text-label">Team</label>
              </div>
              <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
                {team.map((m) => {
                  const isCurrentUser = m.id === user?.id;
                  const displayName = m.name || m.email?.split("@")[0] || "User";
                  return (
                    <div key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-background-secondary">
                      <div
                        className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-background shrink-0"
                        style={{ backgroundColor: getClientColor(displayName) }}
                      >
                        {displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{displayName}</p>
                        <p className="text-[11px] text-foreground-muted truncate">{m.email}</p>
                      </div>
                      {isCurrentUser ? (
                        <span className="text-[11px] font-semibold text-foreground-muted uppercase">You</span>
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
            </div>
          )}

          {/* Theme */}
          <div className="space-y-1.5">
            <label className="text-label">Theme</label>
            <div className="flex gap-2">
              {([
                { value: "light", icon: Sun, label: "Light" },
                { value: "dark", icon: Moon, label: "Dark" },
                { value: "system", icon: Monitor, label: "System" },
              ] as const).map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={theme === value ? "accent" : "secondary"}
                  className="flex-1 gap-1.5"
                  onClick={() => setTheme(value)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sign out */}
          <Button variant="outline" className="w-full" onClick={onSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
