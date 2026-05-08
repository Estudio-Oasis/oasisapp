# Comando — Vista de operación para Super Admin

Una sola pantalla nueva, accesible solo para `super_admin_users`, en `/comando`. No reemplaza al Hub del equipo (que sigue siendo social/colaborativo). Comando es la **war-room**: dónde está el dinero, dónde está el riesgo, dónde está atorada la operación.

## Filosofía (lo que NO es)

- **Si** es un panóptico de productividad por persona.
- **Si** muestra "tiempo activo" como métrica heroica, ni rankings, ni productivity scores.
  **Si puede que** es una grilla de barras en tiempo real de quién está tecleando.
- **Sí** es una bandeja de excepciones priorizada por señal, con cada item accionable.

## Acceso

- Ruta `/comando` envuelta en `<SuperAdminRoute>`.
- Entrada visible solo para super admins: ítem en sidebar desktop ("Comando", icono `Radar`) y acceso rápido en `/superadmin`.
- El equipo regular no ve la ruta ni el ítem de navegación.

---

## Estructura desktop (1440px) sugerida

```text
┌───────────────────────────────────────────────────────────────┐
│  PULSO  · 1 línea, sticky                                     │
│  8 personas · 4 activas · 32h hoy · 78% facturable · ▁▃▅▇▅▃▁ │
├───────────────────────────────────────────────────────────────┤
│  ⚡ ATENCIÓN (3-7 cards apiladas, prioridad descendente)      │
│  [Lazaro: 7h sin pausa]      [Snooze] [Mensaje] [Ver]         │
│  [Voccalo: +14% vs budget]   [Ajustar] [Ver cliente]          │
│  [Tarea X · 4 días en WIP]   [Reasignar] [Mensaje]            │
├──────────────────────────────────┬────────────────────────────┤
│  CALOR POR CLIENTE (2/3)         │  PIPELINE & DINERO (1/3)   │
│  Cliente · Horas/Budget · Riesgo │  Cotizaciones por vencer   │
│  Voccalo  ████████░ 32/28  +14% │  Facturas atrasadas        │
│  Acme     ██████░░░ 18/40  ok   │  Por cobrar este mes       │
├──────────────────────────────────┴────────────────────────────┤
│  TIRA DEL DÍA (8 filas apiladas, mini-Gantt)                  │
│  Carla    ▓▓░▓▓▓▓░░▓▓                                         │
│  Lazaro   ▓▓▓▓▓▓▓▓▓▓▓▓ (sin huecos = señal)                  │
├───────────────────────────────────────────────────────────────┤
│  EQUIPO (de-emphasized, ordenado por señal, no alfabético)    │
│  Cards compactas, quien tiene anomalía aparece arriba         │
└───────────────────────────────────────────────────────────────┘
```

### 1. Pulso (header, una sola línea)

Sticky top. Texto plano, números tabulares, sin cards. Sparkline 7d de horas facturables. Click en cualquier número → drilldown.

### 2. ⚡ Atención (el feature asesino)

Motor de reglas que produce una **cola priorizada**. Cada item:

- Título humano ("Lazaro lleva 7h sin pausa")
- Subtítulo con el "por qué importa"
- 2-3 acciones inline: **Snooze 4h**, **Enviar mensaje**, **Ver detalle**
- Badge de severidad (info / warn / risk)

Reglas iniciales (todas configurables luego):

- Sesión activa > 6h sin pausa → fatiga
- Miembro sin actividad > 48h hábiles → check-in
- Cliente que rebasa horas vs `monthly_rate` esperado → margen
- Tarea `in_progress` > 3 días sin time entry → atorada
- Cotización `sent` > 7 días sin respuesta → seguimiento
- Factura `overdue` → cobranza
- Gap > 4h en bitácora de hoy de algún miembro activo → registro pendiente

Si la cola está vacía: estado vacío celebratorio ("Todo bajo control. 🟢"), no un placeholder genérico.

### 3. Calor por cliente

Tabla compacta, 1 fila por cliente activo:

- Nombre · Barra horas semana / budget esperado · % desviación · Responsable principal · Última actividad
- Color: verde dentro de rango, ámbar 90-110%, rojo >110%
- Reencuadra "ver al equipo" como "ver margen". Click → `/clients/:id`.

### 4. Pipeline & dinero (columna derecha)

Tres mini-listas:

- **Cotizaciones por vencer** (status `sent`, `valid_until` próximo)
- **Facturas atrasadas** (`due_date < today`, `status != paid`)
- **Por cobrar este mes** (suma `invoices.amount` pending)

### 5. Tira del día

Un mini-Gantt: 8 filas (una por miembro), eje X = horario laboral. Bloques de `time_entries` de hoy. Huecos visibles. Sin nombres de tarea (eso es entrar al detalle); solo densidad y forma. Hover → tooltip con detalle.

### 6. Equipo (de-emphasized)

Cards al final, ordenadas por señal:

1. Miembros con item activo en ⚡ Atención
2. Miembros con sesión activa
3. Resto

Cada card: avatar, nombre, estado actual (cliente/tarea), última actividad. Sin "score".

---

## Mobile (375-414px)

**No es desktop chiquito.** Es la bandeja de excepciones del fundador en movimiento.

Stack vertical, sin tabs internos:

1. **Pulso** colapsado a 2 líneas (8 personas · 4 activas · 32h | 78% facturable)
2. **⚡ Atención** — cards swipeables horizontalmente (snap), una visible a la vez. Swipe izquierda = snooze, derecha = ver. Es el corazón de la pantalla móvil.
3. **Tira del día** — scroll horizontal compacto, una imagen del día.
4. **Calor por cliente compacto** — top 5 con desviación más alta.
5. **Pipeline** — solo facturas atrasadas + cotizaciones por vencer (los 2 que requieren acción humana).

Sin equipo cards en móvil — no es lo que el fundador necesita atender desde el teléfono.

Acceso desde móvil: ítem en bottom nav solo visible si es super admin, o FAB tipo "Radar" en `/home`.

---

## Detalles técnicos (sección para devs)

### Frontend

- Nueva ruta `/comando` en `src/App.tsx` envuelta en `SuperAdminRoute`.
- Página `src/pages/Comando.tsx`.
- Componentes nuevos en `src/components/comando/`:
  - `PulseHeader.tsx`
  - `AttentionQueue.tsx` + `AttentionCard.tsx`
  - `ClientHeatmap.tsx`
  - `MoneyPipeline.tsx`
  - `DayStrip.tsx`
  - `TeamSignalList.tsx`
- Hook `useAttentionSignals.ts` — corre las reglas client-side sobre datos ya en cache (time_entries, tasks, invoices, quotes, clients, profiles, member_presence) y devuelve cola ordenada por severidad/recencia.
- Reusar `WidgetCard` existente para mantener DNA visual.
- Mobile: detectar con `useIsMobile()` y renderizar layout alternativo (no responsive puro — son layouts distintos).

### Backend

- **Sin cambios de schema en esta primera versión.** Toda la información ya existe.
- Lectura cruzada multi-agencia: la RLS actual scope-a por `agency_id`, pero los super admins ya tienen policies `is_super_admin()` en `profiles`, `agencies`, `feedback`. Se necesitan policies adicionales `Super admins can view all ...` para:
  - `time_entries`
  - `tasks`
  - `clients`, `projects`
  - `invoices`, `quotes`, `payments`
  - `member_presence`
  Cada una: `CREATE POLICY ... FOR SELECT TO authenticated USING (is_super_admin())`. Solo SELECT, no escritura.
- Acciones inline ("snooze", "mensaje") en v1: snooze guarda en `localStorage` (no requiere tabla); mensaje abre el chat existente con el miembro.

### V2 (no en este sprint, pero pensado)

- Tabla `attention_snoozes` para que snooze persista cross-device.
- Tabla `attention_rules` configurable por super admin (umbrales).
- Edge function `nightly-digest` que envía resumen de Atención por email cada mañana.

---

## Lo que pre-mortem decía y cómo lo evito


| Riesgo                  | Mitigación en este diseño                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| Sentirse vigilancia     | Acceso restringido a super admin; sin productivity scores; sin rankings; equipo de-emphasized |
| Adicción a refrescar    | Sin auto-refresh agresivo; foco en cola accionable, no en tiempo real                         |
| Datos sin decisión      | Cada item de Atención tiene CTA; cada cliente lleva a su perfil; cada métrica es clickeable   |
| No escala a 30 personas | Equipo ordenado por señal, no por nombre; tira del día con virtualización                     |
| Mobile mal entendido    | Layout móvil ≠ desktop; móvil = bandeja de excepciones, no dashboard                          |


---

## Pregunta antes de implementar

Una sola: el motor de **Atención** es el corazón. ¿Quieres que arranque con las 7 reglas que listé arriba, o prefieres elegir 3-4 para v1 y agregar el resto después de ver cómo se siente con datos reales? Mi recomendación: arrancar con **fatiga, tarea atorada, cliente sobre budget, factura atrasada** (4 reglas, una por cuadrante: persona / trabajo / cliente / dinero).  
  
Todo esto es una sugerencia, el outcome es una sección de este producto donde se pueda visualizar toda la información y actividad relevante en tiempo real y al mismo tiempo es decir en la misma sección