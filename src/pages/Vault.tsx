import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, Eye, EyeOff, Copy, Trash2, Pencil, Key,
  Globe, Shield, RefreshCw, ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import type { TranslationKey } from "@/lib/translations";

const CATEGORIES = ["all", "social", "dev", "email", "hosting", "cms", "finance", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_COLORS: Record<string, string> = {
  social: "bg-blue-500/20 text-blue-400",
  dev: "bg-purple-500/20 text-purple-400",
  email: "bg-green-500/20 text-green-400",
  hosting: "bg-orange-500/20 text-orange-400",
  cms: "bg-pink-500/20 text-pink-400",
  finance: "bg-yellow-500/20 text-yellow-400",
  other: "bg-muted text-muted-foreground",
};

interface Credential {
  id: string;
  service: string;
  username: string | null;
  password: string | null;
  url: string | null;
  notes: string | null;
  client_id: string | null;
  agency_id: string | null;
  category: string;
  favicon_url: string | null;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

function generatePassword(length: number, useSymbols: boolean, useNumbers: boolean, useUppercase: boolean): string {
  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (useUppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (useNumbers) chars += "0123456789";
  if (useSymbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr, (v) => chars[v % chars.length]).join("");
}

export default function VaultPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [agencyId, setAgencyId] = useState<string | null>(null);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ service: "", username: "", password: "", url: "", notes: "", client_id: "", category: "other" });

  // Password generator
  const [genLength, setGenLength] = useState(16);
  const [genSymbols, setGenSymbols] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genUppercase, setGenUppercase] = useState(true);

  const labels = useMemo(() => ({
    title: language === "es" ? "Vault" : "Vault",
    searchPlaceholder: language === "es" ? "Buscar credenciales..." : "Search credentials...",
    add: language === "es" ? "Añadir" : "Add",
    edit: language === "es" ? "Editar" : "Edit",
    delete: language === "es" ? "Eliminar" : "Delete",
    service: language === "es" ? "Servicio" : "Service",
    username: language === "es" ? "Usuario" : "Username",
    password: language === "es" ? "Contraseña" : "Password",
    url: "URL",
    notes: language === "es" ? "Notas" : "Notes",
    client: language === "es" ? "Cliente" : "Client",
    category: language === "es" ? "Categoría" : "Category",
    noClient: language === "es" ? "Sin cliente" : "No client",
    save: language === "es" ? "Guardar" : "Save",
    cancel: language === "es" ? "Cancelar" : "Cancel",
    generate: language === "es" ? "Generar" : "Generate",
    length: language === "es" ? "Longitud" : "Length",
    symbols: language === "es" ? "Símbolos" : "Symbols",
    numbers: language === "es" ? "Números" : "Numbers",
    uppercase: language === "es" ? "Mayúsculas" : "Uppercase",
    copied: language === "es" ? "Copiado" : "Copied",
    noCredentials: language === "es" ? "No hay credenciales" : "No credentials",
    addFirst: language === "es" ? "Añade tu primera credencial" : "Add your first credential",
    newCredential: language === "es" ? "Nueva credencial" : "New credential",
    editCredential: language === "es" ? "Editar credencial" : "Edit credential",
    created: language === "es" ? "Creado" : "Created",
    confirmDelete: language === "es" ? "¿Eliminar esta credencial?" : "Delete this credential?",
    deleted: language === "es" ? "Credencial eliminada" : "Credential deleted",
    saved: language === "es" ? "Credencial guardada" : "Credential saved",
    selectClient: language === "es" ? "Seleccionar cliente" : "Select client",
    passwordGenerator: language === "es" ? "Generador de contraseñas" : "Password generator",
    all: language === "es" ? "Todos" : "All",
  }), [language]);

  const categoryLabels: Record<string, string> = useMemo(() => ({
    all: labels.all,
    social: "Social",
    dev: "Dev",
    email: "Email",
    hosting: "Hosting",
    cms: "CMS",
    finance: language === "es" ? "Finanzas" : "Finance",
    other: language === "es" ? "Otro" : "Other",
  }), [language, labels.all]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: profile }, { data: creds }, { data: cls }] = await Promise.all([
      supabase.from("profiles").select("agency_id").eq("id", user.id).single(),
      supabase.from("client_credentials").select("*").order("service"),
      supabase.from("clients").select("id, name").order("name"),
    ]);

    if (profile?.agency_id) setAgencyId(profile.agency_id);
    setCredentials((creds as Credential[]) || []);
    setClients(cls || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    let list = credentials;
    if (categoryFilter !== "all") list = list.filter((c) => c.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.service.toLowerCase().includes(q) ||
        c.username?.toLowerCase().includes(q) ||
        c.url?.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q) ||
        clients.find((cl) => cl.id === c.client_id)?.name.toLowerCase().includes(q)
      );
    }
    return list;
  }, [credentials, categoryFilter, search, clients]);

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(labels.copied);
  };

  const resetForm = () => {
    setForm({ service: "", username: "", password: "", url: "", notes: "", client_id: "", category: "other" });
    setEditingId(null);
  };

  const openAdd = () => { resetForm(); setFormOpen(true); };

  const openEdit = (cred: Credential) => {
    setForm({
      service: cred.service,
      username: cred.username || "",
      password: cred.password || "",
      url: cred.url || "",
      notes: cred.notes || "",
      client_id: cred.client_id || "",
      category: cred.category || "other",
    });
    setEditingId(cred.id);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.service.trim()) return;
    const payload = {
      service: form.service.trim(),
      username: form.username.trim() || null,
      password: form.password || null,
      url: form.url.trim() || null,
      notes: form.notes.trim() || null,
      client_id: form.client_id || null,
      agency_id: agencyId,
      category: form.category,
    };

    if (editingId) {
      await supabase.from("client_credentials").update(payload).eq("id", editingId);
    } else {
      await supabase.from("client_credentials").insert(payload);
    }

    toast.success(labels.saved);
    setFormOpen(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(labels.confirmDelete)) return;
    await supabase.from("client_credentials").delete().eq("id", id);
    toast.success(labels.deleted);
    setExpandedId(null);
    loadData();
  };

  const handleGenerate = () => {
    setForm((f) => ({ ...f, password: generatePassword(genLength, genSymbols, genNumbers, genUppercase) }));
  };

  const getClientName = (clientId: string | null) => {
    if (!clientId) return null;
    return clients.find((c) => c.id === clientId)?.name || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-accent" />
          <h1 className="text-xl font-bold text-foreground">{labels.title}</h1>
          <Badge variant="secondary" className="text-xs">{credentials.length}</Badge>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {labels.add}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="pl-9"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? "bg-accent text-accent-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Credentials list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
            <Key className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground mb-1">{labels.noCredentials}</p>
            <p className="text-sm text-muted-foreground max-w-sm">{credentials.length === 0 ? (language === "es" ? "Guarda las contraseñas de tus clientes de forma segura. Accesibles para todo tu equipo." : "Store your client passwords securely. Accessible to your whole team.") : labels.addFirst}</p>
          </div>
          <Button size="sm" onClick={openAdd} className="gap-1.5">
            <Plus className="h-4 w-4" />
            {labels.add}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((cred) => {
            const isExpanded = expandedId === cred.id;
            const clientName = getClientName(cred.client_id);
            const isPasswordVisible = visiblePasswords.has(cred.id);

            return (
              <div
                key={cred.id}
                className="rounded-lg border border-border bg-card overflow-hidden transition-colors hover:border-border/80"
              >
                {/* Main row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : cred.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Service icon */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-foreground uppercase">
                    {cred.service.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">{cred.service}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[cred.category] || CATEGORY_COLORS.other}`}>
                        {categoryLabels[cred.category] || cred.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {cred.username && (
                        <span className="text-xs text-muted-foreground truncate">{cred.username}</span>
                      )}
                      {clientName && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{clientName}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Password preview + actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {cred.password && (
                      <>
                        <span className="text-xs text-muted-foreground font-mono w-20 truncate">
                          {isPasswordVisible ? cred.password : "••••••••"}
                        </span>
                        <button
                          onClick={() => togglePassword(cred.id)}
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                        >
                          {isPasswordVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(cred.password!)}
                          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-0 border-t border-border/50 space-y-2">
                    {cred.url && (
                      <div className="flex items-center gap-2 text-xs">
                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                        <a href={cred.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate">
                          {cred.url}
                        </a>
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </div>
                    )}
                    {cred.username && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">{labels.username}:</span>
                        <span className="text-foreground font-mono">{cred.username}</span>
                        <button onClick={() => copyToClipboard(cred.username!)} className="p-0.5 rounded hover:bg-muted">
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                    {cred.notes && (
                      <p className="text-xs text-muted-foreground">{cred.notes}</p>
                    )}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                      {labels.created}: {new Date(cred.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(cred)}>
                        <Pencil className="h-3 w-3" /> {labels.edit}
                      </Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs gap-1" onClick={() => handleDelete(cred.id)}>
                        <Trash2 className="h-3 w-3" /> {labels.delete}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!open) { setFormOpen(false); resetForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? labels.editCredential : labels.newCredential}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">{labels.service} *</Label>
              <Input value={form.service} onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))} placeholder="Slack, GitHub, AWS..." />
            </div>
            <div>
              <Label className="text-xs">{labels.category}</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c !== "all").map((cat) => (
                    <SelectItem key={cat} value={cat}>{categoryLabels[cat]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{labels.username}</Label>
              <Input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} placeholder="admin@example.com" />
            </div>
            <div>
              <Label className="text-xs">{labels.password}</Label>
              <div className="flex gap-1.5">
                <Input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="font-mono text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleGenerate} className="shrink-0 gap-1">
                  <RefreshCw className="h-3.5 w-3.5" /> {labels.generate}
                </Button>
              </div>
              {/* Generator options */}
              <div className="mt-2 p-3 rounded-md bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{labels.length}: {genLength}</span>
                  <Slider value={[genLength]} onValueChange={([v]) => setGenLength(v)} min={8} max={32} step={1} className="w-32" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch checked={genUppercase} onCheckedChange={setGenUppercase} className="scale-75" />
                    ABC
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch checked={genNumbers} onCheckedChange={setGenNumbers} className="scale-75" />
                    123
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Switch checked={genSymbols} onCheckedChange={setGenSymbols} className="scale-75" />
                    !@#
                  </label>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs">URL</Label>
              <Input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs">{labels.client}</Label>
              <Select value={form.client_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder={labels.selectClient} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{labels.noClient}</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{labels.notes}</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setFormOpen(false); resetForm(); }}>
                {labels.cancel}
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!form.service.trim()}>
                {labels.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
