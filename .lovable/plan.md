

# Sprint 12: Individual-First Experience Overhaul

## The problem

The entire app is framed as "crea tu agencia" — the copy, onboarding, auth layout, home dashboard, and sidebar all assume a team/agency context. But the free tier is for **individuals**: freelancers, solos, creatives tracking their own work and money. A solo user hitting "Crea tu agencia" or seeing "Invita a tu equipo" feels like the product isn't for them.

The core flows (signup → onboarding → home → daily use) need to feel personal and immediate, not corporate.

---

## What changes

### 1. Auth copy & layout — Make it personal

**AuthLayout.tsx**: Update left panel messaging from "El sistema operativo para tu agencia creativa" to something individual-first:
- Headline: "Organiza tu trabajo. Entiende tu tiempo. Cobra lo que vales."
- Features list: replace team-centric features (Hub, Cotizaciones pro) with individual benefits (Timer inteligente, Valor hora en vivo, Cotizaciones, Insights de productividad)
- Testimonial: change from agency to freelancer/solo perspective

**Login.tsx**: Change "Inicia sesión en tu espacio de trabajo" → "Entra a tu sistema"

**Signup.tsx**: 
- Default headline: "Crea tu cuenta gratis" instead of "Crea tu agencia"
- Subtitle: "Empieza a trackear tu tiempo y cobrar mejor" instead of "El sistema operativo para tu agencia creativa"
- Remove "Confirmar contraseña" field (adds friction, not necessary for signup — validate password length only)

### 2. Onboarding — Simplify for individuals

**OnboardingWizard.tsx**: Restructure from 5 steps to 3 for solo users:

**Step 1 — "¿Cómo trabajas?"** (replaces agency name + country/currency)
- Name field (pre-filled from signup)
- "¿Cómo te describes?" chips: Freelancer / Fundador / Empleado / Otro
- Country + Currency (combined, single row)
- This creates a "personal workspace" instead of an "agency" — but technically still creates the agency record behind the scenes

**Step 2 — "Tu primer cliente"** (keep, it's critical for first value)
- Same as current step 4 but simplified: just client name + billing type
- Skip button prominent

**Step 3 — "Listo"** (summary)
- Remove team invite step entirely from solo flow
- Show "Iniciar mi primera sesión" as primary CTA

The "Invita a tu equipo" step only appears if user later upgrades to Pro.

### 3. Home dashboard — Individual-first layout

**Home.tsx**: Redesign for a solo user's daily command center:

- **Greeting + today's date** (keep, it's warm)
- **Daily progress bar**: "X horas registradas hoy de Y disponibles" — uses work_start/end_hour from profile
- **WelcomeChecklist**: Update items to be individual-relevant:
  - "Registra tu primera hora" (keep)
  - "Agrega tu primer cliente" (keep)
  - ~~"Invita a alguien de tu equipo"~~ (remove for free)
  - ~~"Crea tu primera cotización"~~ (keep but reword: "Crea tu primera propuesta")
  - ~~"Completa el perfil de tu agencia"~~ → "Configura tu perfil"
- **Main grid**: Keep TimerLauncherWidget + DayTasksWidget
- **Secondary**: Keep IdeasWidget + GapsWidget. Remove TeamWidget for free users.
- Hide AdminKPIs entirely for non-admin

### 4. Sidebar — Clean up for free tier

**AppSidebar.tsx**: 
- Fix duplicate upgrade banners (there are TWO "Mejorar plan" blocks — lines 229-243 and 246-261). Remove one.
- For free users, show only: Inicio, Bitácora, Settings
- The upgrade CTA stays but with better copy: "Desbloquea clientes, equipo y cotizaciones"

**BottomNav.tsx**: For free users, show only: Inicio, Bitácora, Ajustes (currently shows Clients, Vault, Finances which are Pro-only and would just redirect)

### 5. BitacoraLayout — Small polish

**BitacoraLayout.tsx**: 
- Change logo from "B" to "O" (OasisOS branding, not a separate product)
- Add user avatar/name in header for context
- Add link to /home if using BitacoraLayout

---

## Technical details

### Files to edit
- `src/components/AuthLayout.tsx` — update copy and features
- `src/pages/Login.tsx` — update subtitle
- `src/pages/Signup.tsx` — update copy, remove confirm password
- `src/components/OnboardingWizard.tsx` — restructure to 3 steps for solo
- `src/pages/Home.tsx` — add daily progress, conditional widgets
- `src/components/dashboard/WelcomeChecklist.tsx` — update items for individual
- `src/components/AppSidebar.tsx` — remove duplicate upgrade banner, filter nav for free
- `src/components/BottomNav.tsx` — filter nav items by plan
- `src/components/BitacoraLayout.tsx` — branding fix + user context

### No database changes needed
All profile fields already exist. The "workspace type" (solo vs team) is implicit from the plan.

### No new files needed
This is pure UX/copy/flow refinement of existing components.

