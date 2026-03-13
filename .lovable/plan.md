## Plan: Configurable Work Schedule per Member

### Current State

The gap detection in `src/pages/Timer.tsx` (line 100-101) hardcodes `9:00 AM` as the workday start. There's no per-member schedule configuration.

### Changes

**1. Database: Add `work_schedule` columns to `profiles` table**

Migration to add two columns:

```sql
ALTER TABLE public.profiles
  ADD COLUMN work_start_hour integer NOT NULL DEFAULT 9,
  ADD COLUMN work_start_minute integer NOT NULL DEFAULT 0;
```

This keeps it simple — each member sets their personal work start time. The gap detector uses this instead of hardcoded 9 AM.

**2. Settings UI: Add "Horario de trabajo" section**

In the existing Settings page, add a new **personal** tab or section (accessible to all members, not just admins) where each user can set their work start time via a time picker (hour:minute select). This could be:

- A new "Personal" tab in Settings, or
- A section in the `ProfileSheet` component (since it's already the personal settings panel)

Given that `ProfileSheet` already handles personal settings (name, password), adding a "Horario de trabajo" section there makes the most sense. It would show a simple time input (e.g., two dropdowns for hour and minute, or an `<input type="time">`) with a save button.

**3. Timer.tsx: Use per-member schedule for gap detection**

- Fetch the current user's `work_start_hour` and `work_start_minute` from their profile
- Replace the hardcoded `nineAm.setHours(9, 0, 0, 0)` with the user's configured values
- Replace `today.getHours() >= 9` check accordingly

### Files to modify

- **Migration**: Add `work_start_hour` and `work_start_minute` to `profiles`
- `**src/components/ProfileSheet.tsx**`: Add work schedule time picker section
- `**src/pages/Timer.tsx**`: Read user's schedule from profile, use in `detectGaps`

### Technical Notes

- No new tables needed — just two integer columns on `profiles`
- Existing RLS policies on `profiles` already allow users to update their own profile
- Default of 9:00 preserves current behavior for existing users  
  
y lo offline también debe quedar registrado, como offline pero al final es informacion que no queremos perder