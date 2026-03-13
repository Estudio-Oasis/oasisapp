import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgencyProfileTab } from "@/components/settings/AgencyProfileTab";
import { MembersTab } from "@/components/settings/MembersTab";
import { IntegrationsTab } from "@/components/settings/IntegrationsTab";
import { toast } from "sonner";

export interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  base_currency: string;
  country: string | null;
  tax_id: string | null;
  legal_name: string | null;
  fiscal_address: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_routing: string | null;
  bank_clabe: string | null;
  bank_swift: string | null;
  allowed_email_domain: string | null;
}

export default function Settings() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("member");

  const fetchAgency = useCallback(async () => {
    if (!user) return;
    // Get user's profile to find agency_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("agency_id, role")
      .eq("id", user.id)
      .single();

    if (profile?.role) setUserRole(profile.role);

    if (profile?.agency_id) {
      const { data } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", profile.agency_id)
        .single();
      if (data) setAgency(data as Agency);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAgency();
  }, [fetchAgency]);

  const handleCreateAgency = async (name: string) => {
    if (!user) return;

    const agencyId = crypto.randomUUID();

    const { error: insertError } = await supabase
      .from("agencies")
      .insert({ id: agencyId, name });

    if (insertError) {
      toast.error("Failed to create agency");
      return;
    }

    // Link user to agency as admin
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ agency_id: agencyId, role: "admin" as const })
      .eq("id", user.id);

    if (profileError) {
      toast.error("Agency created, but failed to link your profile");
      return;
    }

    await fetchAgency();
    setUserRole("admin");
    toast.success("Agency created!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  // No agency yet — show creation prompt
  if (!agency) {
    return <CreateAgencyPrompt onCreate={handleCreateAgency} />;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-h1 text-foreground">Settings</h1>
      <p className="text-small text-foreground-secondary mt-1">
        Manage your agency, team, and billing
      </p>

      <Tabs defaultValue="agency" className="mt-6">
        <TabsList className="bg-background-secondary">
          <TabsTrigger value="agency">Agency Profile</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="mt-4">
          <AgencyProfileTab
            agency={agency}
            isAdmin={userRole === "admin"}
            onUpdate={(updated) => setAgency(updated)}
          />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <MembersTab
            agencyId={agency.id}
            isAdmin={userRole === "admin"}
            allowedDomain={agency.allowed_email_domain}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateAgencyPrompt({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onCreate(name.trim());
    setSaving(false);
  };

  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light">
          <span className="text-xl">🏢</span>
        </div>
        <h2 className="text-h2 text-foreground mt-4">Set up your agency</h2>
        <p className="text-small text-foreground-secondary mt-2">
          Create your agency profile to manage team members, track expenses, and more.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="text"
            placeholder="Agency name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
            autoFocus
          />
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Creating…" : "Create agency →"}
          </button>
        </form>
      </div>
    </div>
  );
}
