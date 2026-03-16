

# Bitácora — Producto Vendible (Etapa 3)

## Lo que existe hoy

**Componentes modulares listos** (en `src/components/timer/`):
- `ActiveSessionCard` (3 variantes: compact, mobile, expanded)
- `TimerControls` (switch, pause, finish — row/stack layouts)
- `TimeEntryRow` (con activity type normalization)
- `GapAlert`, `DayInsights`, `QuickLogInput`, `RecentsPanel`, `EmptyState`
- `ActivityConstants` (taxonomía de 9 tipos, UI_COPY completo en es-MX)
- `ContextBadge`, `ActivityTypeSelector`

**Playground** (`/playground/activity-engine`): demo funcional con datos mock, variantes y previews de FAB/sidebar/drawer. Pero es un playground de desarrollo, no una pieza de marketing.

**Timer page** (`/timer`): página real conectada a Supabase, 280 líneas monolíticas que no reutiliza los componentes modulares del playground.

**Landing** (`/`): landing de Estudio Oasis con sección de "2026 Performance Manager". No tiene demo interactiva de Bitácora.

---

## Propuesta: 3 contextos, 1 suite de componentes

### Contexto 1 — Bitácora dentro de OasisOS (`/bitacora`)

Reemplaza `/timer`. Usa los componentes modulares en vez del monolito actual.

**Estructura de la página:**
1. **Hero de sesión** — `ActiveSessionCard variant="expanded"` + `TimerControls` (datos reales de `TimerContext`)
2. **CTA de inicio** — cuando no hay sesión: `QuickLogInput` prominente → abre `RecentsPanel` → dispara `StartTimerModal`
3. **Timeline visual** — nueva barra horizontal de bloques de color proporcionales al tiempo, coloreados por cliente (componente nuevo: `DayTimeline`)
4. **Day Insights** — `DayInsights` con datos reales
5. **Feed cronológico** — `TimeEntryRow` + `GapAlert` intercalados, datos de Supabase
6. **Filtros** — tabs Hoy/Semana + Mis registros/Todos (ya existen, se mantienen)
7. **Entrada manual** — botón al fondo

**Cambios técnicos:**
- Crear `src/pages/Bitacora.tsx` (~120 líneas) como composición de componentes existentes + hooks
- Crear `src/modules/bitacora/hooks/useTimeEntries.ts` — extraer la lógica de fetch/gaps de `Timer.tsx`
- Crear `src/components/timer/DayTimeline.tsx` — barra horizontal de bloques de color
- Renombrar ruta `/timer` → `/bitacora` en `App.tsx`, sidebar y bottom nav
- Eliminar `Timer.tsx` después de migrar

### Contexto 2 — Bitácora standalone en landing (`/bitacora-demo`)

Una demo interactiva con datos simulados premium que se embeda en la landing y funciona como página standalone. No requiere auth.

**Qué es:**
- Una versión del playground pero con estética de marketing, no de debugging
- Sin el selector de variantes ni previews de FAB/sidebar
- Simula un día completo con datos realistas de una agencia (mismos mock data del playground, refinados)
- Interactiva: el usuario puede hacer tap en "Iniciar", "Cambiar", ver cómo se llena el timeline

**Estructura:**
1. **Header de contexto** — "Bitácora · Registro de actividad" con branding de Oasis
2. **Mockup de dispositivo** — frame de teléfono o card tipo browser window (como el hero de la landing actual)
3. **Dentro del frame**: `ActiveSessionCard` → `DayTimeline` → feed con `TimeEntryRow` + `GapAlert`
4. **CTA debajo**: "Empieza a registrar tu trabajo" → `/signup`

**Componentes reutilizados:** Exactamente los mismos componentes de timer/, con datos mock en vez de Supabase. Cero duplicación.

**Cambios técnicos:**
- Crear `src/pages/BitacoraDemo.tsx` — usa los mismos componentes con datos mock (hereda del playground)
- Agregar ruta `/bitacora-demo` como pública en `App.tsx`
- En la landing, reemplazar el mockup estático del hero (o la sección de "Performance Manager") con un link/embed a la demo
- Eliminar `/playground/activity-engine` o mantenerlo como ruta de desarrollo interna

### Contexto 3 — Widget persistente (ya existe)

- `TimerWidget` en sidebar desktop — ya funciona
- `TimerFAB` en mobile — ya funciona, ya restringido a rutas auth
- Sin cambios necesarios

---

## Componente nuevo: `DayTimeline`

La pieza visual que falta para elevar la experiencia. Una barra horizontal que muestra el día como bloques proporcionales de color:

```text
9:00                                              17:00
├──── Oasis ────┤░░┤──── MuchosLeads ────┤┊┊┊┤── Acme ──┤
     #B8956A      ☕      #5B8DEF          gap    #28C840
```

**Props:**
- `entries: { startedAt, endedAt, clientName, clientId, description }[]`
- `gaps: { startTime, endTime }[]`
- `workStart`, `workEnd` (hours)
- `onGapClick?: (gap) => void`

**Implementación:** `div` con `flex`, cada bloque tiene `flex-basis` proporcional a su duración. Gaps en `border-dashed`. Colores por `getClientColor()`.

---

## Navegación actualizada

**Bottom nav mobile (3 tabs):**
| Icono | Label | Ruta |
|-------|-------|------|
| Activity | Bitácora | `/bitacora` |
| Users | Clientes | `/clients` |
| DollarSign | Finanzas | `/finances` |

Hub → icono en mobile header. Settings → accesible desde profile.

**Sidebar desktop:** Renombrar "Timer" → "Bitácora", mantener el resto por ahora.

---

## Qué cambia vs qué se comparte

```text
COMPONENTE              OASIS OS    DEMO LANDING    COMPARTIDO
─────────────────────   ────────    ────────────    ──────────
ActiveSessionCard       ✓ (real)    ✓ (mock)        ✓
TimerControls           ✓ (real)    ✓ (mock)        ✓
TimeEntryRow            ✓ (real)    ✓ (mock)        ✓
DayTimeline             ✓ (real)    ✓ (mock)        ✓ (NEW)
DayInsights             ✓ (real)    ✓ (mock)        ✓
GapAlert                ✓ (real)    ✓ (mock)        ✓
QuickLogInput           ✓ (real)    ✓ (mock)        ✓
RecentsPanel            ✓ (real)    ✓ (mock)        ✓
EmptyState              ✓           ✗               solo OS
TimerWidget (sidebar)   ✓           ✗               solo OS
TimerFAB (mobile)       ✓           ✗               solo OS
useTimeEntries hook     ✓           ✗               solo OS
Mock data layer         ✗           ✓               solo demo
```

**Regla:** los componentes de `timer/` nunca importan de Supabase ni de contextos auth. Son presentacionales puros. Los hooks de datos viven aparte.

---

## Sensación "widget / dispositivo digital"

Para que Bitácora se sienta como un instrumento de trabajo y no como una pantalla más:

- **Timeline visual** como elemento central — es la "pantalla" del dispositivo
- **Pulsing dot** en sesión activa — indica "vivo"
- **Transiciones suaves** al cambiar actividad (150ms ease-out)
- **Números tabular-nums** en el timer — sin saltos visuales
- **Fondo `background-secondary`** con cards `background` elevadas — profundidad sin sombras
- **Bordes sutiles**, esquinas `rounded-xl` consistentes
- **Micro-labels** (`text-micro`, uppercase, tracking-wider) para secciones

---

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `src/components/timer/DayTimeline.tsx` | **CREAR** — barra visual del día |
| `src/pages/Bitacora.tsx` | **CREAR** — composición modular, reemplaza Timer.tsx |
| `src/pages/BitacoraDemo.tsx` | **CREAR** — demo marketing con mock data |
| `src/hooks/useTimeEntries.ts` | **CREAR** — extraer lógica de fetch/gaps |
| `src/App.tsx` | **MODIFICAR** — renombrar ruta, agregar demo |
| `src/components/AppSidebar.tsx` | **MODIFICAR** — Timer → Bitácora |
| `src/components/BottomNav.tsx` | **MODIFICAR** — 3 tabs core |
| `src/components/AppLayout.tsx` | **MODIFICAR** — mobile header con Hub icon |
| `src/pages/Landing.tsx` | **MODIFICAR** — link a demo en sección de producto |
| `src/pages/Timer.tsx` | **ELIMINAR** — reemplazado por Bitacora.tsx |

---

## Orden de implementación

1. **`DayTimeline`** — componente visual nuevo
2. **`useTimeEntries` hook** — extraer lógica de Timer.tsx
3. **`Bitacora.tsx`** — nueva página modular con datos reales
4. **`BitacoraDemo.tsx`** — demo con mock data para marketing
5. **Navegación** — renombrar rutas, simplificar bottom nav a 3 tabs
6. **Landing** — conectar demo interactiva
7. **Cleanup** — eliminar Timer.tsx y playground

