

## Problem

`<TimerFAB />` renders globally in `App.tsx` (line 63), outside of `ProtectedRoute`. It appears on the landing page, login, signup, and any public route where it makes zero sense.

## Fix

**Move `<TimerFAB />` inside the `ProtectedRoute` wrapper** in `App.tsx`, so it only renders for authenticated users within the app layout.

Specifically:
- Remove `<TimerFAB />` from its current position (line 63, sibling of `<Routes>`)
- Place it inside `AppLayout.tsx`, right before the closing `</div>` of the layout wrapper — this way it only renders on authenticated app pages and naturally coexists with the `BottomNav`

**File changes:**

1. **`src/App.tsx`** — Remove the `<TimerFAB />` line and its import
2. **`src/components/AppLayout.tsx`** — Import and render `<TimerFAB />` inside the layout, after `<BottomNav />`

This is the cleanest fix: the FAB belongs to the authenticated app experience, not the global shell.

