import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: { name: string; role: string };
  onProfileUpdated: (updated: { name: string }) => void;
  onSignOut: () => void;
}

export function ProfileSheet({ open, onOpenChange, profile, onProfileUpdated, onSignOut }: ProfileSheetProps) {
  const { user } = useAuth();
  const [name, setName] = useState(profile.name);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
