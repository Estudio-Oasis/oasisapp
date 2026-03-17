

# Plan: Bitácora Personal — Public Launch Readiness

Phase A only. No landing overhaul. No Task Master build. Analytics, auto-confirm, 14-day free tier, first-use activation, demo→account polish.

---

## 1. Analytics Events Table + Instrumentation

**DB migration:**
```sql
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  user_id uuid,
  session_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert events" ON public.analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Service role reads events" ON public.analytics_events
  FOR SELECT USING (auth.role() = 'service_role');
```

**New file:** `src/lib/analytics.ts`
- `trackEvent(event, metadata?)` — inserts to `analytics_events` via supabase client
- Auto-includes `page` (window.location.pathname), `is_authenticated`, `is_demo`, `timestamp`
- Generates a `session_id` (stored in sessionStorage) for grouping events within a visit

**8 events to instrument:**

| Event | File | Trigger |
|---|---|---|
| `landing_view` | Landing.tsx | useEffect on mount |
| `demo_start` | StandaloneShell.tsx | MiniOnboarding onComplete |
| `demo_first_entry` | LocalBitacoraProvider.tsx | After first entry with `ended_at` |
| `signup_start` | Signup.tsx | useEffect on mount |
| `signup_complete` | Signup.tsx | After successful signUp |
| `first_entry_account` | OasisBitacoraProvider.tsx | After first time_entries insert for user |
| `feedback_clicked` | StandaloneShell.tsx, Settings.tsx | On feedback link click |
| `dictation_used` | QuickStartPanel.tsx, BitacoraQuickSheet.tsx | On mic button press |

`day_2_return` will be computed from query (users with events on day+1 after signup), not instrumented as a fired event.

## 2. Auto-confirm Signup

Use `cloud--configure_auth` to enable auto-confirm for email signups. Temporary pre-PMF decision.

**Code change in Signup.tsx:** After successful signup with auto-confirm, the user gets a session immediately. The existing `navigate("/bitacora")` already handles this. Add a welcome toast: `"¡Listo! Tu cuenta está creada."` (and mention demo migration count if applicable).

## 3. Free Tier → Bitácora Personal (14 days)

**File:** `src/lib/plan-limits.ts`
- `maxHistoryDays: 7` → `maxHistoryDays: 14`
- Add `maxAiRefinePerDay: 5`
- Add `planDisplayName: "Bitácora Personal"` to FREE_LIMITS
- Add `planDisplayName: "Task Master"` to PRO_LIMITS

**File:** `src/components/timer/AiRefineButton.tsx`
- Add localStorage counter (`bitacora_ai_refine_YYYY-MM-DD`) to cap at 5/day for free users
- Accept optional `plan` prop; if free and limit reached, show "Límite diario alcanzado" instead of button

**File:** `src/pages/Settings.tsx` (line 186-190)
- Change "Plan gratuito" → "Bitácora Personal"
- Add subtle line: "¿Necesitas visibilidad de equipo? Task Master próximamente →"

## 4. First-use Activation for New Accounts

**File:** `src/pages/Bitacora.tsx`
- Pass `autoOpenSheet` to `BitacoraCore` when user has 0 entries (check via a quick count query or piggyback on existing `entries` from provider)

The `BitacoraCore` already supports `autoOpenSheet` prop and the logic at lines 34-40 handles it. Just need to pass it from the page.

**Approach:** In `OasisBitacoraProvider`, expose an `isEmpty` flag (entries.length === 0 after initial fetch). In `Bitacora.tsx`, read it and pass `autoOpenSheet={isEmpty}`.

## 5. Demo → Signup → Account Polish

**File:** `src/pages/Signup.tsx`
- After auto-confirm, user gets session immediately → navigate to `/bitacora`
- Improve toast: if demo entries migrated, `"¡Listo! Tu cuenta está creada y tus ${count} registros del demo están guardados."`; otherwise `"¡Listo! Tu cuenta está creada. ¿En qué estás trabajando?"`
- Track `signup_complete` event

**File:** `src/modules/bitacora/StandaloneShell.tsx`
- Track `demo_start` in MiniOnboarding onComplete
- Track `feedback_clicked` on feedback link

## 6. Minimal Landing Adjustments (no overhaul)

**File:** `src/pages/Landing.tsx`
- Track `landing_view` on mount
- No structural changes to SystemView or plan cards
- Only: in the hero subtitle or existing copy, ensure "Bitácora Personal" appears naturally (one line change max)

---

## Files Summary

| Action | File |
|---|---|
| **New** | `src/lib/analytics.ts` |
| **DB migration** | `analytics_events` table |
| **Auth config** | auto-confirm via tool |
| **Edit** | `src/lib/plan-limits.ts` |
| **Edit** | `src/components/timer/AiRefineButton.tsx` |
| **Edit** | `src/pages/Settings.tsx` |
| **Edit** | `src/pages/Bitacora.tsx` |
| **Edit** | `src/pages/Signup.tsx` |
| **Edit** | `src/pages/Login.tsx` (track `login_complete` — optional 9th event) |
| **Edit** | `src/pages/Landing.tsx` (analytics only) |
| **Edit** | `src/modules/bitacora/StandaloneShell.tsx` (analytics) |
| **Edit** | `src/modules/bitacora/OasisBitacoraProvider.tsx` (expose isEmpty) |
| **Edit** | `src/modules/bitacora/demo/QuickStartPanel.tsx` (track dictation) |
| **Edit** | `src/modules/bitacora/BitacoraQuickSheet.tsx` (track dictation) |

## What this does NOT include

- No landing page overhaul or plan cards
- No Task Master MVP build (team feed, load by member, digest)
- No new edge functions
- No database schema changes beyond `analytics_events`

## Execution order

1. DB migration (analytics_events)
2. `src/lib/analytics.ts` helper
3. Auto-confirm signup (tool call)
4. Plan limits update (14 days + AI cap + display names)
5. AiRefineButton daily limit
6. Settings upgrade path copy
7. First-use activation (Bitacora.tsx + OasisBitacoraProvider)
8. Signup flow polish
9. Instrument all 8 analytics events across files

