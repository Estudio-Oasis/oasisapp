

## Plan: Smart Status Buttons with Timer Integration

### What changes

The Hub status buttons become "smart" — each one triggers a different flow:

1. **"En línea"** → Opens a prompt/modal asking "¿En qué estás trabajando?" (reuses `StartTimerModal`). If a timer is already running, it opens the modal in "switch" mode. This encourages logging productive time.

2. **"Break", "Comiendo", "AFK"** → If a timer is running, shows the existing stop-timer dialog, then starts a break timer. If no timer is running, directly starts a break timer for that status. No prompt needed.

3. **"Reunión"** → Same as break statuses (starts a break-style timer with "Reunión" label).

4. **"Offline"** → Uses Moon icon (already present). Stops any running timer and sets status to offline. No new timer starts.

### UI Changes (Hub.tsx)

- **"En línea" button click**: Opens `StartTimerModal` (mode = "start" or "switch" if timer is running). After the user fills client/task/description and starts, status changes to "working" automatically (already handled by `startTimer`).

- **Break/Comiendo/AFK/Reunión clicks**: Current behavior already mostly works. Just ensure that if NO timer is running, it directly calls `startBreakTimer(status)` + `setManualStatus(status)` without showing the dialog.

- **Offline click**: Stops active timer (if any) without starting a break timer, sets status to "offline".

- Moon icon is already imported — just move it to the "Offline" button and use a different icon for "Reunión" (e.g., `Users` or `Video` from lucide).

### Technical Details

**Files to modify:**
- `src/pages/Hub.tsx` — Rework `handleStatusChange` logic:
  - `"online"` → open StartTimerModal (import it, add state for open/mode)
  - `"break"|"eating"|"bathroom"|"meeting"` → if timer running, show stop dialog; if not, directly `startBreakTimer(status)` + `setManualStatus(status)`
  - `"offline"` → if timer running, stop it; then `setManualStatus("offline")`
- Update icon array: Reunión → `Video` or `Users` icon, Offline → `Moon` icon (add Offline button to the list)
- Import `StartTimerModal` component

**No new tables or migrations needed.**

