import { supabase } from "@/integrations/supabase/client";

export interface AiSuggestion {
  field: string;
  issue: string;
  suggested_value: string | null;
}

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
  suggestions: AiSuggestion[];
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

  return {
    ...data,
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
  } as ExtractedClientData;
}

export async function callAiFieldHelper(
  action: string,
  context: Record<string, unknown>
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("ai-field-helper", {
    body: { action, context },
  });

  if (error) throw new Error(error.message || "AI helper failed");
  if (data?.error) throw new Error(data.error);
  return data.result as string;
}
