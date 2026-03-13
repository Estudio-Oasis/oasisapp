

## Multi-user Shared Workspace — Implementation Plan

### Current State Assessment

Most of the infrastructure is already in place:
- **profiles** table exists with `id`, `name`, `email`, `avatar_url`, `role` (app_role enum), `agency_id`
- **handle_new_user** trigger auto-creates profile on signup
- **Login/Signup** pages exist and work
- **Shared RLS** on clients, tasks, projects, invoices, payments, expenses already allows all authenticated users full CRUD
- **Task assignee** dropdown already queries profiles and stores `assignee_id`
- **time_entries** already uses `user_id`

What's missing or needs changing:

---

### 1. Database: Open time_entries SELECT to all authenticated users

Currently `time_entries` SELECT policy restricts to `auth.uid() = user_id`. For shared reporting, all authenticated users need to see all entries.

**Migration:**
```sql
DROP POLICY "Users can view own time entries" ON public.time_entries;
CREATE POLICY "Authenticated can view all time entries"
  ON public.time_entries FOR SELECT TO authenticated
  USING (true);
```

INSERT/UPDATE/DELETE policies remain scoped to `auth.uid() = user_id` (already correct).

---

### 2. Sidebar: Show profile data + Profile slide-over

**File: `src/components/AppSidebar.tsx`**
- Fetch the current user's profile from `profiles` table on mount (get `name`, `avatar_url`, `role`)
- Display avatar image (or initials fallback), `name`, and a role badge ("Admin" / "Member")
- Add a gear icon that opens a `Sheet` (slide-over panel) with:
  - Edit full name field
  - Change password (calls `supabase.auth.updateUser({ password })`)
  - Sign out button
  - (Skip avatar upload for now — keep initials fallback)

---

### 3. Signup: Add "Confirm password" field

**File: `src/pages/Signup.tsx`**
- Add a "Confirm password" input
- Validate passwords match before calling `signUp()`

---

### 4. Timer page: Show who logged each entry + filter toggle

**File: `src/pages/Timer.tsx`**
- Remove the `.eq("user_id", user.id)` filter from the entries query (or make it conditional)
- Join profiles via `user_id` to get name for each entry
- In `renderEntry()`, display a small avatar/initials + name next to each time entry row
- Add a toggle at the top: "My entries" / "All entries" (default: "My entries")
- When "All entries" is selected, remove the user_id filter; when "My entries", keep it

---

### 5. Task views: Show assignee avatar from profiles

**Files: `src/pages/Tasks.tsx`, `src/components/TaskDetailPanel.tsx`**
- Already fetching profiles and mapping assignees — this is mostly done
- Ensure the task list and kanban views render the assignee's initials/avatar next to each task card
- In `TaskDetailPanel`, the assignee dropdown already lists profiles — confirm it works with multiple users

---

### 6. Client Profile time tab: Show who logged each entry

**File: `src/pages/ClientProfile.tsx`**
- In the Time tab, join profiles on `user_id` to display the logger's name next to each entry
- Add the same "My entries / All entries" filter toggle

---

### Summary of changes

| Area | Files | Type |
|------|-------|------|
| RLS for time_entries | Migration | DB |
| Sidebar profile + slide-over | `AppSidebar.tsx` | UI |
| Confirm password | `Signup.tsx` | UI |
| Timer multi-user view | `Timer.tsx` | UI + query |
| Client profile time tab | `ClientProfile.tsx` | UI + query |
| Task assignee rendering | `Tasks.tsx` (minor) | UI |

No changes to Finances module. No roles/permissions gating.

