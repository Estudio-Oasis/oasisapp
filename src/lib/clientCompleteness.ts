interface ClientFields {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  monthly_rate?: number | null;
  contact_name?: string | null;
  payment_method?: string | null;
  communication_channel?: string | null;
  billing_entity?: string | null;
  [key: string]: unknown;
}

export function calculateCompleteness(client: ClientFields): number {
  let score = 0;

  // Required: email OR phone (20 pts)
  if (client.email || client.phone) score += 20;

  // Required: monthly_rate > 0 (20 pts)
  if (client.monthly_rate && client.monthly_rate > 0) score += 20;

  // Important fields (15 pts each)
  if (client.contact_name) score += 15;
  if (client.payment_method) score += 15;
  if (client.communication_channel) score += 15;
  if (client.billing_entity) score += 15;

  return score;
}

export function getMissingFields(client: ClientFields): string[] {
  const missing: string[] = [];

  if (!client.email && !client.phone) missing.push("Email or phone");
  if (!client.monthly_rate || client.monthly_rate <= 0) missing.push("Monthly rate");
  if (!client.contact_name) missing.push("Contact name");
  if (!client.payment_method) missing.push("Payment method");
  if (!client.communication_channel) missing.push("Communication channel");
  if (!client.billing_entity) missing.push("Billing entity");

  return missing;
}

export type CompletenessLevel = "critical" | "incomplete" | "complete";

export function getCompletenessLevel(score: number): CompletenessLevel {
  if (score < 40) return "critical";
  if (score < 80) return "incomplete";
  return "complete";
}
