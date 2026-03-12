

# OasisOS — Phase 1: Foundation

## What we're building
The skeleton of OasisOS: authentication (login/signup), responsive app shell (sidebar + bottom nav), profiles table, full database schema, and the design system applied globally.

## Design System
- Font: Inter (400, 500, 600, 700)
- Colors: #FFFFFF main bg, #F7F7F5 secondary bg, #0A0A0A text, #6B6B6B secondary text, #E8E8E8 borders, #F5A623 amber accent, #16A34A success, #DC2626 error
- No shadows — borders and background only
- Border radius: 8px cards, 6px inputs, 999px badges
- 8px spacing grid, 24px mobile margins, 32px desktop margins

## Database (all tables created upfront via migrations)

1. **profiles** — id (FK auth.users), name, email, avatar_url, role (admin/member), created_at. Auto-created via trigger on signup.
2. **user_roles** — id, user_id (FK auth.users), role (app_role enum: admin/member/user). RLS with `has_role` security definer function.
3. **clients** — id, name, email, phone, website, notes, status, billing_type, monthly_rate, currency, created_at
4. **projects** — id, name, client_id (FK), status, type, created_at
5. **tasks** — id, title, description, client_id (FK), project_id (FK nullable), assignee_id (FK profiles), status enum, priority enum, due_date, created_at
6. **time_entries** — id, user_id (FK), client_id (FK), task_id (FK nullable), project_id (FK nullable), started_at, ended_at, duration_min (generated), description, is_gap_flagged, created_at
7. **invoices** — id, client_id (FK), number, amount, currency, status enum, due_date, paid_at, notes, created_at
8. **client_interactions** — id, client_id (FK), user_id (FK), type enum, title, body, happened_at, created_at

RLS enabled on all tables. Basic policies: authenticated users can read/write their own data.

## Auth Pages
- `/login` — centered card, email + password, link to signup
- `/signup` — centered card, email + password, link to login
- On signup: trigger auto-creates profile row
- After login: redirect to `/timer`
- Auth context/hook wrapping protected routes

## App Shell (responsive layout)
- **Desktop (≥768px)**: Fixed left sidebar 220px wide, #FAFAFA bg, #E8E8E8 right border. Logo "OS" at top. 4 nav items: Timer, Clients, Tasks, Finances. Active item uses #F5A623 amber accent.
- **Mobile (<768px)**: No sidebar. Bottom navigation bar with 4 icons (Timer ⚡, Clients 👤, Tasks ✓, Finances $). Active uses amber.
- Placeholder pages at `/timer`, `/clients`, `/tasks`, `/finances`

## Files to create/modify

| File | Purpose |
|------|---------|
| `src/index.css` | Update CSS variables to match design system |
| `src/integrations/supabase/client.ts` | Supabase client setup (Lovable Cloud) |
| `src/contexts/AuthContext.tsx` | Auth provider with session management |
| `src/components/AppSidebar.tsx` | Desktop sidebar using shadcn Sidebar |
| `src/components/BottomNav.tsx` | Mobile bottom navigation |
| `src/components/AppLayout.tsx` | Shell layout combining sidebar + bottom nav + main content |
| `src/components/ProtectedRoute.tsx` | Route guard redirecting to /login |
| `src/pages/Login.tsx` | Login page |
| `src/pages/Signup.tsx` | Signup page |
| `src/pages/Timer.tsx` | Placeholder |
| `src/pages/Clients.tsx` | Placeholder |
| `src/pages/Tasks.tsx` | Placeholder |
| `src/pages/Finances.tsx` | Placeholder |
| `src/App.tsx` | Routes setup |
| DB migrations | All 8 tables + enums + trigger + RLS |

## Order of execution
1. Apply design system to `index.css` and `tailwind.config.ts`
2. Set up Lovable Cloud + Supabase client
3. Run all database migrations (tables, enums, trigger, RLS)
4. Build auth context + login/signup pages
5. Build app shell (sidebar, bottom nav, layout)
6. Create placeholder pages + wire routes
7. Add protected route wrapper

