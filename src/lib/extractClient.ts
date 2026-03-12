import { supabase } from "@/integrations/supabase/client";

export interface ExtractedClientData {
  name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  billing_entity: string | null;
  monthly_rate: number | null;
  currency: string | null;
  payment_method: string | null;
  payment_frequency: string | null;
  communication_channel: string | null;
  notes: string | null;
}

export async function extractClientFromText(text: string): Promise<ExtractedClientData> {
  const { data, error } = await supabase.functions.invoke("extract-client", {
    body: { text },
  });

  if (error) {
    throw new Error(error.message || "Extraction failed");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return data as ExtractedClientData;
}
