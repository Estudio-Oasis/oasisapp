
# Dashboard Principal — Rediseño Completo

## Filosofía
El Dashboard y la Bitácora comparten el mismo backend (`time_entries`, `tasks`, `clients`, `projects`). El Dashboard es la **vista de comando** — widgets rápidos para actuar. La Bitácora es la **vista de registro detallado** — timeline completo del día.

---

## Sprint A — Dashboard Core (este bloque)

### 1. Widget "Mi Día de Hoy"
- Card principal con tareas asignadas al usuario con status `todo` o `in_progress`
- Header con 2 botones: **"+ Tarea hoy"** (crea con `due_date = today`) y **"+ Para después"** (crea sin fecha, va al backlog)
- Cada tarea muestra: título, prioridad (badge color), cliente, botón "Iniciar" que activa el timer
- Conectado a la misma tabla `tasks` — todo lo que se agregue aquí aparece en `/tasks`

### 2. Widget "Bitácora" (Timer con 4 modos)
- Card estilo widget iPhone con título "Bitácora" y botón "Iniciar timer"
- Al hacer click se expande un prompt con **4 opciones**:
  1. **"Tarea libre"** — inicia timer sin contexto, subtexto "Llénala después"
  2. **"Continuar con..."** — muestra últimas 20 tareas en scroll para elegir
  3. **"Escoger tarea"** — búsqueda por cliente/proyecto/status con filtros
  4. **"Crear tarea"** — formulario rápido inline
- **Estado activo**: la card cambia de color (amber/accent glow) y muestra 4 botones circulares estilo Apple:
  - ☕ **Break** — pausa con tipo de actividad
  - 🔄 **Cambiar** — switch a otra tarea
  - 📝 **Nota** — agrega nota a la entrada activa (con @menciones de usuarios)
  - 💡 **Idea** — captura idea que se guarda en sección "Ideas" del dashboard
- Todo escribe en `time_entries` — aparece automáticamente en `/bitacora`

### 3. Widget "Ideas"
- Sección que muestra ideas capturadas (tareas con tag especial o campo)
- Las ideas se guardan como tareas con status `backlog` y un marcador
- Botón para convertir idea en tarea formal

### 4. Widget "Equipo" (admin + members)
- Muestra avatares con estado online/offline/working
- Click → ir a chat o ver resumen de trabajo
- Datos de `member_presence` + `profiles`

### 5. Widget "Accesos Directos"
- Grid de shortcuts: Calendario, Clientes, Cotizaciones, Vault
- El de **Calendario** lleva a una nueva vista de calendario

### 6. Widget "Finanzas" (solo admin)
- KPIs: MRR, cobrado este mes
- Últimos pagos recibidos
- Recordatorio de cuentas por cobrar (facturas vencidas/próximas)

### 7. Widget "Gaps" (recordatorio)
- Muestra huecos de tiempo sin llenar del día
- Botón rápido para rellenar desde el dashboard

---

## Sprint B — Calendario (siguiente bloque)

### Nueva tabla `calendar_events`
- Campos: `title`, `date`, `type` (birthday, payment_date, deadline, custom), `related_entity_id`, `related_entity_type`, `recurrence`, `agency_id`, `created_by`
- RLS por agency_id
- Vista de calendario mensual con eventos + tareas con due_date
- Permite agregar: cumpleaños de empleados/clientes, fechas de cobro, deadlines

---

## Sprint C — Hub mejorado (siguiente bloque)

### Canales tipo Slack
- Nueva tabla `channels` con miembros
- Nueva tabla `channel_messages` con archivos
- UI tipo Slack: sidebar de canales, thread view, file sharing
- Esto es un cambio grande que requiere su propio sprint

---

## Archivos a crear/modificar (Sprint A)
- `src/pages/Home.tsx` — reescribir completo con nuevo layout de widgets
- `src/components/dashboard/DayTasksWidget.tsx` — "Mi día de hoy"
- `src/components/dashboard/TimerLauncherWidget.tsx` — Widget Bitácora con 4 modos
- `src/components/dashboard/TimerActiveControls.tsx` — Controles circulares cuando timer está activo
- `src/components/dashboard/IdeasWidget.tsx` — Sección de ideas
- `src/components/dashboard/TeamWidget.tsx` — Equipo
- `src/components/dashboard/ShortcutsWidget.tsx` — Accesos directos
- `src/components/dashboard/FinanceSummaryWidget.tsx` — Finanzas (admin)
- `src/components/dashboard/GapsWidget.tsx` — Recordatorio de huecos

## Sin cambios en DB para Sprint A
- Usa tablas existentes: `tasks`, `time_entries`, `clients`, `projects`, `member_presence`, `payments`, `invoices`
- Las "ideas" se guardan como tareas con `status = 'backlog'` y `description` que contiene tag `[idea]`

## Dependencias
- Ninguna nueva — usa `@dnd-kit` ya instalado, shadcn/ui, TimerContext existente
