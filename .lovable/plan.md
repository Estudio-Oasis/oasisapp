

## Fix Plan: 3 RBAC + Onboarding Bugs

### BUG 1 — New user doesn't see onboarding

**Root cause:** The `handle_new_user()` trigger doesn't include `onboarded` or `role` in the INSERT. While column defaults cover this, the `auto_join_agency` trigger (which runs BEFORE INSERT on profiles) sets `role` but not `onboarded`. The column default of `false` should work, but the `AppSidebar` useEffect depends on `[user]` (object reference) which can cause extra re-renders that overwrite state.

**Fix:**
1. **Migration** — Update `handle_new_user()` to explicitly set `onboarded = false` and `role = 'member'`:
   ```sql
   CREATE OR REPLACE FUNCTION handle_new_user() ...
   INSERT INTO public.profiles (id, name, email, role, onboarded)
   VALUES (NEW.id, ..., 'member', false)
   ON CONFLICT (id) DO NOTHING;
   ```
   Also ensure existing admins stay onboarded: `UPDATE profiles SET onboarded = true WHERE role = 'admin'`.

2. **AppSidebar.tsx** — Add a `useRef` guard so the welcome modal only triggers once per session (prevents re-renders from resetting it). Change useEffect dependency from `[user]` to `[user?.id]`.

### BUG 2 — Member can see Finances

**Root cause:** The nav filter `allNavItems.filter((item) => !item.adminOnly || isAdmin)` doesn't account for `loading` state. While `isAdmin` is `false` during loading (which should hide it), the real issue is `useRole` depends on `[user]` (object reference) which may cause stale closures.

**Fix:**
1. **useRole.ts** — Change dependency to `[user?.id]` instead of `[user]`.
2. **AppSidebar.tsx** — Get `loading` from `useRole()` and filter: `if (item.adminOnly) return !loading && isAdmin`.
3. **Finances.tsx** — Already has the redirect guard; verify it works correctly with the `useRole` fix.

### BUG 3 — Member can cancel pending invitations

**Root cause:** The ProfileSheet already wraps the team section in `{isAdmin && (...)}` which should hide it for members. However, if `isAdmin` briefly returns the wrong value or the member loads team data before role resolves, they could see actions. Also, the `loadTeamData` call runs when `open && isAdmin` but pending invites are fetched without agency_id filter, relying only on RLS. The RLS DELETE policy on `agency_invitations` already restricts to admins, so a member's delete should fail at DB level — but they shouldn't see the UI.

**Fix:**
1. **ProfileSheet.tsx** — Double-check `isAdmin` gating is solid. The existing code already gates on `isAdmin` (line 200), so this should work once `useRole` is fixed.
2. No RLS change needed — `agency_invitations` DELETE policy already checks `is_admin()`.

### Summary of changes

| File | Change |
|---|---|
| **Migration SQL** | Update `handle_new_user()` to explicitly set `role` and `onboarded` |
| **useRole.ts** | Change effect dependency from `[user]` to `[user?.id]` |
| **AppSidebar.tsx** | Add `loading` from `useRole()`, guard nav filter + add `useRef` for welcome modal |
| **Finances.tsx** | No change needed (redirect already exists) |
| **ProfileSheet.tsx** | No change needed (already gated on `isAdmin`) |

