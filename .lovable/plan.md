

## Problem: Cannot remove member r@estudiooasis.com

**Root cause:** The `profiles` table RLS policy for UPDATE is `auth.uid() = id` — users can only update their **own** profile. When an admin tries to remove a member (setting `agency_id = null` on another user's profile), the update silently fails because RLS blocks it. Supabase returns `204` even though zero rows were affected.

## Fix

**Migration — Add admin UPDATE policy on profiles:**

```sql
CREATE POLICY "Admins can update agency member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  agency_id IN (
    SELECT p.agency_id FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
```

This allows admins to update profiles of users in their same agency. Combined with the existing self-update policy, both cases are covered.

**MembersTab.tsx — Add error handling to handleRemoveMember:**

Check the update result for errors and show a toast if it fails, instead of silently assuming success.

| File | Change |
|---|---|
| Migration SQL | Add admin UPDATE policy on profiles |
| MembersTab.tsx | Add error check on remove member update |

