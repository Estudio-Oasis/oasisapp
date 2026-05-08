## Análisis: limpieza de código y duplicados

He auditado los 41,121 LOC del proyecto (51 componentes raíz, 37 páginas, 12 hooks, ~30 componentes shadcn/ui). Estos son los hallazgos y el plan de limpieza.

---

### 1. Archivos huérfanos (sin imports en ningún sitio)

**Componentes producto (8):**
- `src/components/NavLink.tsx` — reemplazado por `<Link>` directo
- `src/components/TimerWidget.tsx` — sustituido por `SidebarTimerSlot` + `TimerLauncherWidget`
- `src/components/bitacora/InteractiveTimeline.tsx` — sustituido por `timer/DayTimeline`
- `src/components/dashboard/ShortcutsWidget.tsx` — quitado del bento home
- `src/components/hub/MemberBubble.tsx` — Hub usa cards ahora
- `src/components/timer/InlineContextChips.tsx` — duplicado de `modules/bitacora/BitacoraInlineChips`
- `src/modules/bitacora/BitacoraInlineChips.tsx` — sin consumidores
- `src/modules/bitacora/demo/TrackDayHint.tsx` — quitado de demo

**Página muerta:**
- `src/pages/Index.tsx` — placeholder "Welcome to Your Blank App", no enrutado
- `src/pages/Timer.tsx` — `/timer` ahora redirige a `/bitacora` con `<Navigate>`; el `import TimerPage from "./pages/Timer"` en `App.tsx` es código muerto

**Hook muerto:**
- `src/hooks/useActivityTracking.ts`

**Lib muerto:**
- `src/lib/plan-limits.ts` (la lógica vive en `usePlan`/`stripe-plans`)

**Componentes UI shadcn no usados (19):**
`accordion`, `aspect-ratio`, `breadcrumb`, `calendar`, `carousel`, `chart`, `checkbox`, `collapsible`, `command`, `context-menu`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `radio-group`, `resizable`, `scroll-area`, `toggle-group`

(Boilerplate de shadcn que nunca se importó. Se borra el `.tsx` y la dependencia `@radix-ui/react-*` correspondiente del `package.json`.)

**Test setup huérfano:**
- `src/test/setup.ts` está referenciado por `vitest.config.ts` pero el único test (`src/test/example.test.ts`) no necesita matchers DOM. Mantener si vamos a escribir tests; documentar. **Acción:** mantener.

---

### 2. Duplicados funcionales (consolidar)

| Capa | Duplicado | Canónico | Acción |
|---|---|---|---|
| Timer launcher | `TimerWidget.tsx` | `SidebarTimerSlot` + `dashboard/TimerLauncherWidget` | borrar `TimerWidget` |
| Inline chips | `timer/InlineContextChips` + `modules/bitacora/BitacoraInlineChips` | ninguno consumido | borrar ambos |
| Timeline | `bitacora/InteractiveTimeline` | `timer/DayTimeline` | borrar `InteractiveTimeline` |
| `/timer` route | `pages/Timer.tsx` | redirect a `/bitacora` | borrar página + import |
| Landing/Index | `pages/Index.tsx` | `pages/Landing.tsx` | borrar `Index.tsx` |

**No tocar (parecen duplicados, pero no lo son):**
- `TimerFAB` (FAB móvil) ≠ `SidebarTimerSlot` (sidebar desktop) ≠ `TimerLauncherWidget` (widget Home). Tres contextos legítimos.
- `StartTimerModal` ≠ `QuickSheet` (uno es modal de start, otro hoja inferior móvil).
- `HelpFAB`/`HelpDrawer` ≠ `RogerContactFab` (último vive solo en `/roger`).

---

### 3. Premortem — qué podría romper

| Riesgo | Mitigación |
|---|---|
| Borro un UI shadcn que `lovable-tagger`/algún componente nuevo usará luego | Solo borro los que `rg` confirma 0 imports hoy. Reinstalable con `bun add`. |
| `plan-limits.ts` tiene lógica única no migrada | Verificar `rg` antes de borrar; si hay referencia indirecta, abortar ese archivo. |
| `pages/Timer.tsx` aún linkado por algún botón o `navigate("/timer")` | La ruta `/timer` se mantiene como redirect; solo borro el archivo y el import. |
| Tests rompen | Solo hay `example.test.ts`; no toca lo borrado. |
| Build falla por dep removida que algún UI sí usa | Por cada `@radix-ui/react-*` borrado, ejecutar `rg "@radix-ui/react-X"` antes. |

---

### 4. QA post-limpieza

1. `bun run build` (lo dispara la harness automáticamente).
2. Smoke en preview: `/`, `/home`, `/bitacora`, `/tasks`, `/hub`, `/clients`, `/finances`, `/settings`, `/comando`, `/timer` (debe redirigir).
3. Confirmar que sidebar, timer FAB móvil y bento Home siguen renderizando.

---

### 5. Plan de cambios

**Fase A — borrar archivos huérfanos (sin tocar imports porque no existen):**
```
src/components/NavLink.tsx
src/components/TimerWidget.tsx
src/components/bitacora/InteractiveTimeline.tsx
src/components/dashboard/ShortcutsWidget.tsx
src/components/hub/MemberBubble.tsx
src/components/timer/InlineContextChips.tsx
src/modules/bitacora/BitacoraInlineChips.tsx
src/modules/bitacora/demo/TrackDayHint.tsx
src/hooks/useActivityTracking.ts
src/lib/plan-limits.ts
src/pages/Index.tsx
```

**Fase B — borrar `pages/Timer.tsx` + quitar su import en `src/App.tsx`** (ruta `/timer` ya es `<Navigate to="/bitacora">`).

**Fase C — borrar shadcn no usados:**
```
src/components/ui/{accordion,aspect-ratio,breadcrumb,calendar,carousel,chart,
  checkbox,collapsible,command,context-menu,form,hover-card,input-otp,menubar,
  navigation-menu,pagination,radio-group,resizable,scroll-area,toggle-group}.tsx
```
Y `bun remove` de los `@radix-ui/react-*` huérfanos correspondientes + `cmdk`, `embla-carousel-react`, `input-otp`, `react-day-picker`, `react-resizable-panels`, `recharts` (si confirmo 0 imports en Fase C).

**Fase D — verificar:** build limpio + smoke routes.

---

### Resultado esperado
- ~30 archivos borrados (~3,500–4,500 LOC menos).
- ~10–12 dependencias menos en `package.json`.
- Cero cambios funcionales para el usuario.
- Sidebar, Home bento, Bitácora, Hub, Tasks intactos.

¿Procedo con las 4 fases o prefieres que omita la **Fase C** (shadcn UI) por seguridad?
