
# Rediseño OasisOS · Cassiu v2

Pre-mortem honesto antes de empezar:

- **El riesgo grande no es feo, es romper el día a día.** Bitácora y Home son las pantallas que el equipo abre 30 veces al día. Si tropiezan, pierdes confianza. Por eso vamos por fases pequeñas, una por turno, con preview entre cada una.
- **El tono "bold"** (más ámbar, hero moments, texturas) puede pasarse de Apple-bento a "casino". Lo aplicamos con disciplina: ámbar como acento, no como fondo. Texturas sutiles (noise grain a 3% de opacidad). Un hero por pantalla, no varios.
- **Datos vs decoración.** Cada widget tiene que responder "¿qué hago con esto?". Si no, fuera.

---

## Fase 0 — Acceso Comando (5 minutos)

Insertar `r@estudiooasis.com` y `carla@estudiooasis.com` en `super_admin_users` para que ambos vean el link "Comando" en el sidebar y puedan entrar a `/comando`. Esto destraba lo que ya está construido.

## Fase 1 — Móvil bento + bottom tabs

Lo más visible y de más alto impacto. La pantalla principal del móvil pasa a ser un tablero bento.

- **Home mobile** (`src/pages/Home.tsx` versión mobile): hero ámbar con saludo + frase contextual ("Llevas 4h 33m hoy, 55% facturable…"), seguido de tablero bento con widgets de tamaño variado:
  - Timer activo (grande, hero ámbar si hay timer corriendo)
  - Tira del día (rail compacto con bloques de horas)
  - Hueco a llenar (si existe)
  - Próxima tarea
  - KPIs del día (horas, % facturable)
  - Equipo en vivo (mini)
  - Briefing OasisOS
- **Bottom nav** (`src/components/BottomNav.tsx`): 4 tabs — Inicio, Bitácora, Hub, Más. FAB ámbar central para captura rápida (`⌘K` equivalente en móvil → abre `QuickLogInput` en sheet).
- **Tab "Más"**: tareas, clientes, cotizaciones, finanzas, vault, ajustes en lista agrupada.

```
┌─────────────────────┐
│  Buenas tardes,     │  ← hero ámbar
│  Roger              │
│  4h 33m · 55% bill  │
├──────────┬──────────┤
│ ⏱ ACTIVO │ TU DÍA   │
│  0:42    │ ▓▓░▓▓░  │
│ Plan Q4  │ 4h 33m  │
├──────────┴──────────┤
│ HUECO 33m · llenar →│
├──────────┬──────────┤
│ EQUIPO   │ PRÓXIMA  │
│ 4 act.   │ tarea... │
└──────────┴──────────┘
[Inicio][Bit][Hub][Más]
        ⊕ FAB ámbar
```

## Fase 2 — Inicio v2 desktop (tablero bento)

Convertir `Home.tsx` desktop al mismo lenguaje bento que el móvil:

- Hero ámbar con saludo contextual + frase del día.
- Grid bento (no las columnas actuales), con widgets reutilizando los que ya existen (`TimerLauncherWidget`, `DayTasksWidget`, `GapsWidget`, `TeamWidget`, `FinanceSummaryWidget`, `IdeasWidget`) pero con tamaños variados (grande / mediano / chico) en lugar de columnas iguales.
- "Cliente del día" como widget nuevo (cliente con más horas hoy + MRR + horas/mo).
- Acceso visible a "Captura rápida ⌘K" en el header.

## Fase 3 — Bitácora v2 (riel + bloques)

El cambio más profundo. Resolver el conflicto "timeline vs lista":

- Una sola columna del día con riel de horas a la izquierda (08 → 19h).
- Cada `time_entry` se renderiza como bloque sobre el riel, con altura proporcional a duración.
- Huecos como bloques rayados (no como banner aparte).
- Click en bloque → abre `EntryEditSheet` lateral.
- Filtros arriba: Todo / Facturable / Huecos / Hoy.
- Mantener `MorningBriefing` arriba si no hay actividad.

Refactor de `BitacoraCore.tsx` + `InteractiveTimeline.tsx` (se fusionan en un solo componente `DayRail.tsx`).

## Fase 4 — Hub v2

Reorganizar `Hub.tsx` con secciones por estado, ordenadas por señal (no alfa):

- TRABAJANDO · N (verde)
- EN REUNIÓN · N
- EN PAUSA · N
- AUSENTES · N
- ACTIVIDAD RECIENTE (feed de últimos eventos)

Cada miembro muestra avatar, nombre, cliente actual, tarea actual, tiempo en sesión.

## Fase 5 — Refinamientos secundarios

Pulido de Tareas (lista agrupada con hero ámbar para P1 más urgente, toggle a Kanban), Clientes (MRR + horas + salud), Cotizaciones (pipeline visual), Finanzas (MRR + por cobrar + facturación reciente), Vault (sin cambios mayores). Estos son retoques visuales, no refactor.

---

## Tono visual "bold" — reglas de aplicación

Para evitar que se sienta de casino:

- **Ámbar = acento, no fondo.** Solo en: hero del saludo, FAB, números KPI heroicos, badge del timer activo.
- **Textura:** ruido sutil (`bg-[url(noise.svg)] opacity-[0.03]`) solo en hero del saludo.
- **Hero moments:** UN hero por pantalla. El saludo en Home, el timer activo en Bitácora, el "atención #1" en Comando.
- **Tipografía:** números tabulares grandes (text-4xl/5xl) para KPIs heroicos. Playfair se mantiene para titulares editoriales (saludo).
- Tokens nuevos en `index.css`: `--gradient-amber-hero`, `--texture-grain`. Sin tocar Sand/Charcoal/Gold base.

---

## Detalles técnicos (referencia)

- Fase 0: `INSERT INTO super_admin_users (id) SELECT id FROM profiles WHERE email IN ('r@estudiooasis.com','carla@estudiooasis.com');`
- Fase 1: `BottomNav.tsx` (4 tabs + FAB), nuevo `src/components/home/MobileBentoHome.tsx`, condicional `useIsMobile()` en `Home.tsx`.
- Fase 2: refactor de `Home.tsx` desktop con CSS Grid bento (`grid-cols-12` con `col-span` variables).
- Fase 3: nuevo `src/components/bitacora/DayRail.tsx`, sustituye render actual en `BitacoraCore.tsx`. `InteractiveTimeline.tsx` se deprecia.
- Fase 4: refactor de `Hub.tsx`, reusa `MemberBubble`, agrupa por status.
- Tokens nuevos en `src/index.css` y `tailwind.config.ts`.

---

## Cómo procedemos

Cuando aceptes este plan ejecuto **Fase 0 + Fase 1 en el primer turno** (acceso Comando + móvil bento, ambos cambios independientes y de bajo riesgo). Luego avanzamos una fase por turno con preview entre cada una. Si en cualquier punto algo no se siente bien, lo corregimos antes de seguir.
