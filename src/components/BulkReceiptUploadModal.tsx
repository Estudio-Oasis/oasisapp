import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { ImageEditorModal } from "@/components/ImageEditorModal";
import { InlineNewClient } from "@/components/InlineNewClient";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ImagePlus,
  Loader2,
  Pencil,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ImageEditorModal } from "@/components/ImageEditorModal";
import type { Tables } from "@/integrations/supabase/types";

type Client = Tables<"clients">;

interface ScanResult {
  amount_received: number | null;
  currency_received: string | null;
  date_received: string | null;
  sender_name: string | null;
  reference: string | null;
  transaction_id: string | null;
  method: string | null;
  confidence: "high" | "medium" | "low";
  notes: string | null;
}

interface ReceiptItem {
  id: string;
  originalFile: File;
  editedFile: File | null;
  previewUrl: string;
  status: "pending" | "scanning" | "scanned" | "error" | "saving" | "saved";
  scanResult: ScanResult | null;
  clientId: string;
  error?: string;
}

interface BulkReceiptUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function BulkReceiptUploadModal({
  open,
  onOpenChange,
  onCreated,
}: BulkReceiptUploadModalProps) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [defaultClientId, setDefaultClientId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems([]);
    setDefaultClientId("");
    setProcessing(false);
    setSaving(false);
    supabase
      .from("clients")
      .select("*")
      .order("name")
      .then(({ data }) => setClients(data || []));
  }, [open]);

  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newItems: ReceiptItem[] = files
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({
        id: crypto.randomUUID(),
        originalFile: f,
        editedFile: null,
        previewUrl: URL.createObjectURL(f),
        status: "pending" as const,
        scanResult: null,
        clientId: defaultClientId,
      }));

    if (newItems.length < files.length) {
      toast.error("Some files were skipped (over 10MB)");
    }
    setItems((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const openEditor = (id: string) => {
    setEditingItemId(id);
    setEditorOpen(true);
  };

  const handleEditorConfirm = (editedFile: File) => {
    if (!editingItemId) return;
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== editingItemId) return item;
        const newUrl = URL.createObjectURL(editedFile);
        URL.revokeObjectURL(item.previewUrl);
        return { ...item, editedFile, previewUrl: newUrl };
      })
    );
    setEditingItemId(null);
  };

  const editingItem = items.find((i) => i.id === editingItemId);
  const editingFile = editingItem?.editedFile || editingItem?.originalFile || null;

  // Scan all pending items
  const scanAll = async () => {
    const toScan = items.filter(
      (i) => i.status === "pending" || i.status === "error"
    );
    if (toScan.length === 0) return;
    setProcessing(true);

    for (const item of toScan) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "scanning" } : i))
      );

      try {
        const fileToScan = item.editedFile || item.originalFile;
        const formData = new FormData();
        formData.append("image", fileToScan);

        const res = await supabase.functions.invoke("scan-receipt", {
          body: formData,
        });

        if (res.error) throw new Error("AI scanning failed");

        const data = res.data as ScanResult;
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "scanned", scanResult: data }
              : i
          )
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "error",
                  error:
                    err instanceof Error ? err.message : "Scanning failed",
                }
              : i
          )
        );
      }
    }
    setProcessing(false);
  };

  const updateItemClient = (id: string, clientId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, clientId } : i))
    );
  };

  // Apply default client to items without one
  useEffect(() => {
    if (!defaultClientId) return;
    setItems((prev) =>
      prev.map((i) => (i.clientId ? i : { ...i, clientId: defaultClientId }))
    );
  }, [defaultClientId]);

  const scannedItems = items.filter((i) => i.status === "scanned");
  const readyToSave = scannedItems.filter(
    (i) => i.clientId && i.scanResult?.amount_received
  );

  const saveAll = async () => {
    if (readyToSave.length === 0) return;
    setSaving(true);

    let created = 0;
    for (const item of readyToSave) {
      const sr = item.scanResult!;
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "saving" } : i))
      );

      const payload: Record<string, unknown> = {
        client_id: item.clientId,
        amount_received: sr.amount_received,
        currency_received: sr.currency_received || "USD",
        date_received: sr.date_received || new Date().toISOString().split("T")[0],
        sender_name: sr.sender_name || null,
        reference: sr.reference || null,
        transaction_id: sr.transaction_id || null,
        method: sr.method || "wise",
        notes: sr.notes || null,
        created_by: user?.id || null,
      };

      const { data: inserted, error } = await supabase
        .from("payments")
        .insert(payload as never)
        .select("id")
        .single();

      if (error || !inserted) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: "Failed to save" }
              : i
          )
        );
        continue;
      }

      // Upload receipt
      const fileToUpload = item.editedFile || item.originalFile;
      if (user) {
        const path = `${user.id}/${inserted.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(path, fileToUpload, { contentType: "image/jpeg" });

        if (!uploadError) {
          const { data: signedData } = await supabase.storage
            .from("receipts")
            .createSignedUrl(path, 60 * 60 * 24 * 365);

          if (signedData?.signedUrl) {
            await supabase
              .from("payments")
              .update({ receipt_url: signedData.signedUrl } as Record<string, unknown>)
              .eq("id", inserted.id);
          }
        }
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: "saved" } : i))
      );
      created++;
    }

    setSaving(false);
    toast.success(`${created} payment${created !== 1 ? "s" : ""} logged`);
    if (created > 0) onCreated();
    if (created === readyToSave.length) onOpenChange(false);
  };

  const progress = useMemo(() => {
    if (items.length === 0) return 0;
    const done = items.filter(
      (i) => i.status === "scanned" || i.status === "saved"
    ).length;
    return Math.round((done / items.length) * 100);
  }, [items]);

  const CONFIDENCE_STYLES: Record<string, string> = {
    high: "bg-success-light text-success",
    medium: "bg-accent-light text-accent-foreground",
    low: "bg-destructive-light text-destructive",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[640px] p-0 gap-0 border-border max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="p-5 pb-3">
            <DialogTitle className="text-h3">
              Bulk receipt scan
            </DialogTitle>
            <p className="text-small text-foreground-muted">
              Upload multiple receipts — AI extracts data from each and creates
              payment records automatically.
            </p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
            {/* Default client */}
            <div className="space-y-1.5">
              <label className="text-label">Default client</label>
              <Select value={defaultClientId} onValueChange={setDefaultClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client for all receipts..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload zone */}
            <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl p-5 cursor-pointer bg-background-secondary hover:bg-background-tertiary transition-colors text-center">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesSelect}
              />
              <ImagePlus className="h-6 w-6 text-foreground-muted" />
              <span className="text-sm font-medium text-foreground">
                Select receipts
              </span>
              <span className="text-small text-foreground-muted">
                Select multiple images at once · Max 10MB each
              </span>
            </label>

            {/* Items */}
            {items.length > 0 && (
              <div className="space-y-3">
                {processing && (
                  <Progress value={progress} className="h-2" />
                )}

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="border border-border rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.previewUrl}
                        alt="Receipt"
                        className="h-14 w-14 rounded-lg object-cover border border-border shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.originalFile.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.status === "pending" && (
                            <span className="text-small text-foreground-muted">
                              Ready to scan
                            </span>
                          )}
                          {item.status === "scanning" && (
                            <span className="text-small text-foreground-muted flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Scanning...
                            </span>
                          )}
                          {item.status === "scanned" && item.scanResult && (
                            <>
                              <span className="text-sm font-semibold text-foreground">
                                ${item.scanResult.amount_received?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "—"}{" "}
                                {item.scanResult.currency_received || ""}
                              </span>
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                  CONFIDENCE_STYLES[item.scanResult.confidence] || ""
                                }`}
                              >
                                {item.scanResult.confidence}
                              </span>
                            </>
                          )}
                          {item.status === "error" && (
                            <span className="text-small text-destructive flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {item.error}
                            </span>
                          )}
                          {item.status === "saving" && (
                            <span className="text-small text-foreground-muted flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Saving...
                            </span>
                          )}
                          {item.status === "saved" && (
                            <span className="text-small text-success flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Saved
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.status !== "saved" && item.status !== "saving" && (
                          <>
                            <button
                              onClick={() => openEditor(item.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-foreground hover:bg-background-secondary"
                              title="Edit image"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-md text-foreground-muted hover:text-destructive hover:bg-background-secondary"
                              title="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Scanned details */}
                    {item.status === "scanned" && item.scanResult && (
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border mt-2">
                        <div>
                          <p className="text-micro text-foreground-muted">Date</p>
                          <p className="text-sm text-foreground">
                            {item.scanResult.date_received || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-micro text-foreground-muted">Method</p>
                          <p className="text-sm text-foreground capitalize">
                            {item.scanResult.method || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-micro text-foreground-muted">Sender</p>
                          <p className="text-sm text-foreground">
                            {item.scanResult.sender_name || "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-micro text-foreground-muted">Ref</p>
                          <p className="text-sm text-foreground truncate">
                            {item.scanResult.reference || item.scanResult.transaction_id || "—"}
                          </p>
                        </div>
                        {/* Per-item client override */}
                        <div className="col-span-2">
                          <p className="text-micro text-foreground-muted mb-1">Client</p>
                          <Select
                            value={item.clientId}
                            onValueChange={(v) => updateItemClient(item.id, v)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue placeholder="Select client..." />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-small text-foreground-muted">
                {items.length} receipt{items.length !== 1 ? "s" : ""}
                {scannedItems.length > 0 &&
                  ` · ${readyToSave.length} ready to save`}
              </p>
              <div className="flex items-center gap-2">
                {items.some(
                  (i) => i.status === "pending" || i.status === "error"
                ) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={scanAll}
                    disabled={processing}
                  >
                    {processing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                    )}
                    Scan all
                  </Button>
                )}
                {readyToSave.length > 0 && (
                  <Button
                    size="sm"
                    onClick={saveAll}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    )}
                    Save {readyToSave.length} payment
                    {readyToSave.length !== 1 ? "s" : ""}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImageEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        imageFile={editingFile}
        onConfirm={handleEditorConfirm}
      />
    </>
  );
}
