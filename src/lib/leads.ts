import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

/** Shared validation for every public lead form on the site. */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

export const leadSchema = z
  .object({
    source: z.enum(["cotizador", "brief"]),
    lang: z.enum(["es", "en"]),
    name: optionalText(120),
    company: optionalText(160),
    email: z
      .string()
      .trim()
      .max(255)
      .email()
      .optional()
      .transform((v) => v ?? null),
    contact: optionalText(255),
    business: optionalText(300),
    website: optionalText(300),
    team_size: optionalText(60),
    revenue_range: optionalText(60),
    stage: optionalText(60),
    channels: z.array(z.string().trim().max(80)).max(30).optional().default([]),
    goals: z.array(z.string().trim().max(80)).max(30).optional().default([]),
    needs: z.array(z.string().trim().max(120)).max(30).optional().default([]),
    context: optionalText(4000),
    tried: optionalText(4000),
    monthly_min: z.number().int().nonnegative().nullable().optional().default(null),
    monthly_max: z.number().int().nonnegative().nullable().optional().default(null),
    project_min: z.number().int().nonnegative().nullable().optional().default(null),
    project_max: z.number().int().nonnegative().nullable().optional().default(null),
  })
  .refine((v) => Boolean(v.email) || Boolean(v.contact), {
    message: "contact-required",
  });

export type LeadInput = z.input<typeof leadSchema>;

export type LeadResult = { ok: true } | { ok: false; reason: "invalid" | "network" };

/** Validates and stores a lead. Never throws. */
export async function submitLead(input: LeadInput): Promise<LeadResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  const row = {
    ...parsed.data,
    page_path:
      typeof window !== "undefined" ? window.location.pathname.slice(0, 300) : null,
    referrer:
      typeof document !== "undefined" && document.referrer
        ? document.referrer.slice(0, 500)
        : null,
  };

  const { error } = await supabase.from("leads").insert(row);
  if (error) return { ok: false, reason: "network" };
  return { ok: true };
}
