

# Sprint 10-11: Landing Page Overhaul + Super Admin Module

## What we're solving

The landing page has two critical problems visible right now:
1. **Hero screenshot is AI-generated garbage** — shows "Racimpe", "Kesk", gibberish text instead of real product UI
2. **Narrative structure is backwards** — portfolio showcase appears before explaining what OasisOS does, confusing visitors about whether this is a design agency or a SaaS product
3. **Pricing plan names are unclear** — "Equipo 3/6/10" don't communicate value tiers
4. **No mobile screenshots** — visitors don't know the app works on phones
5. **No origin story** — no emotional connection or credibility context

The Super Admin module is needed for Roger to manage beta agencies across the multi-tenant system.

---

## Sprint 10: Landing Page Overhaul

### L1 — Take real screenshots of the app
Use browser tools to capture actual screenshots from `/home`, `/bitacora`, `/hub`, `/quotes` at desktop and mobile sizes. Generate polished product shots using the product-shot skill with appropriate gradient presets. Save to `src/assets/` as proper images.

### L2 — Restructure Landing page narrative
Rewrite `src/pages/Landing.tsx` with sections in correct order:
1. Hero (existing, with real screenshot)
2. Agency Logos (existing)
3. **Origin Story** (NEW) — dark section: "No lo construimos en un hackathon. Lo construimos después de 15 años viviendo el mismo caos que tú." with portfolio category chips linking to `/portfolio`
4. Problem section (existing, moved up)
5. Product Tabs (existing, keep)
6. **Desktop & Mobile section** (NEW) — browser frame + iPhone frame with real screenshots
7. Philosophy/NotJust section (existing)
8. For Who section (existing)
9. Pricing (updated names)
10. How It Works (existing)
11. CTA (existing)
12. Footer (existing)

**Removed from landing:** `FeaturedWork` (full portfolio showcase) — it stays at `/portfolio`
**Removed from landing:** `OasisOSSection` (redundant with ProductTabs)
**Removed from landing:** `StatsSection` (counter section)

### L3 — Update pricing plan names
In both `Landing.tsx` PricingSection and `src/lib/stripe-plans.ts`:
- "Bitácora Personal" → **"Solo"** ($0)
- "Equipo 3" → **"Starter"** ($9)
- "Equipo 6" → **"Estudio"** ($16, marked "Más popular")
- "Equipo 10" → **"Agencia"** ($20)

Also update `Pricing.tsx` plan names to match.

### L4 — Update hero copy
Change subheading to: "Todo lo que tu agencia necesita para facturar más, operar mejor y crecer sin caos."

---

## Sprint 11: Super Admin Module

### S1 — Database migration
Create tables and columns:
- `super_admin_users` table (id references auth.users, RLS: only super admins can read)
- `super_admin_audit_log` table for action tracking
- Add `plan_override` and `is_active` columns to `agencies` table
- Create `agency_stats` view for dashboard queries
- RLS policies allowing super admins to read across all agencies

### S2 — SuperAdminRoute guard
Create `src/components/SuperAdminRoute.tsx` — checks if user exists in `super_admin_users` table, redirects to `/home` if not.

### S3 — SuperAdmin dashboard page
Create `src/pages/SuperAdmin.tsx` with:
- Header: "OasisOS Super Admin"
- 4 KPI cards: Total Agencies, Total Users, Active This Week, MRR
- Two tabs: Agencies (searchable table with plan badges, member count, last activity, status) and Feedback (cards from all agencies)
- Agency detail dialog with plan override dropdown

### S4 — Route + beta invite flow
- Add `/superadmin` route in `App.tsx` wrapped in `SuperAdminRoute`
- Update `Signup.tsx` to detect `?ref=beta` and show beta messaging
- Update `OnboardingWizard.tsx` to set `plan_override = 'agencia'` for beta signups

---

## Files to create
- `src/types/superadmin.ts`
- `src/components/SuperAdminRoute.tsx`
- `src/pages/SuperAdmin.tsx`

## Files to edit
- `src/pages/Landing.tsx` (major rewrite)
- `src/lib/stripe-plans.ts` (plan names)
- `src/pages/Pricing.tsx` (plan names)
- `src/App.tsx` (add superadmin route)
- `src/pages/Signup.tsx` (beta params)
- `src/components/OnboardingWizard.tsx` (beta plan override)

## Database migration
- Add `plan_override`, `is_active` to agencies
- Create `super_admin_users`, `super_admin_audit_log` tables
- Create `agency_stats` view
- RLS policies for super admin access

