

## Dark Mode Implementation Plan

### Current State
- `next-themes` is already installed
- CSS variables for `.dark` are already defined in `src/index.css`
- Tailwind is configured with `darkMode: ["class"]`
- `sonner.tsx` already uses `useTheme()` from `next-themes`

The infrastructure is 90% ready — just need to wrap the app with `ThemeProvider` and add a toggle.

### Changes

**1. `src/App.tsx` — Wrap with ThemeProvider**
- Import `ThemeProvider` from `next-themes`
- Wrap the app content inside `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`

**2. `src/components/ProfileSheet.tsx` — Add theme toggle**
- Add a "Theme" section with three buttons: Light / Dark / System
- Use `useTheme()` from `next-themes` to get/set the theme
- Place it between the password section and the sign-out button

**3. `src/components/AppSidebar.tsx` — Add quick toggle icon**
- Add a Sun/Moon icon button near the logo area or footer for quick desktop toggling

That's it — all colors already use CSS variables with dark variants defined, so the entire UI will adapt automatically.

