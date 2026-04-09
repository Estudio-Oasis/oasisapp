

# Sprint 2 — Plan de Implementación

## Resumen

6 bloques en orden de prioridad. El objetivo es transformar OasisOS de "prototipo funcional" a "producto con momento wow".

---

## 1. Dashboard / Home Page (`/home`) — PRIORIDAD 1

**Qué se construye:**
- Nueva página `src/pages/Home.tsx` con 4 secciones en grid responsive
- Sección superior (ancho completo): card de timer activo (amber) o morning briefing con CTA
- Sección izquierda (2/3): hasta 5 tareas del día (todo/in_progress, asignadas al usuario, por prioridad) con botón "Iniciar" inline
- Sección derecha (1/3): mini-Hub con avatares + estado (solo admins)
- Sección inferior: últimos 3 pagos + KPIs MRR/cobrado (solo admins)

**Cambios en routing:**
- Agregar ruta `/home` dentro del bloque protegido en `App.tsx`
- Redirigir `/` (post-login) a `/home` para usuarios autenticados; mantener Landing para no-auth
- Actualizar sidebar logo link a `/home`
- Leer `TimerContext` para detectar timer activo

**Datos necesarios:** `profiles`, `tasks`, `member_presence`, `payments`, `clients` — todos ya tienen RLS correcto.

---

## 2. Kanban de Tareas — PRIORIDAD 2

**Qué se construye:**
- Toggle "Lista | Kanban" en header de `Tasks.tsx`, estado en localStorage
- Nuevo componente `src/components/tasks/TaskKanbanView.tsx`
- 5 columnas: backlog, todo, in_progress, review, done
- Cards con: título, badge prioridad (colores), avatar asignado, fecha límite, cliente
- Drag & drop con `@dnd-kit/core` + `@dnd-kit/sortable`

**Técnico:**
- Instalar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- Optimistic update: mover card en UI, luego `supabase.update()` en background
- Botón "+" por columna abre `NewTaskModal` con status pre-seleccionado
- Cards vencidas con `border-destructive`

---

## 3. Enviar Cotización por Email — PRIORIDAD 3

**Qué se construye:**
- Botón "Enviar por email" en vista detalle de cotización
- Modal `SendQuoteEmailModal` con campos: Para, Asunto, Mensaje (todos pre-llenados), indicador de PDF adjunto
- Edge function `send-quote-email` que genera el HTML del email con resumen de la cotización y envía vía el sistema de email existente

**Prerequisitos de email:**
- Verificar estado del dominio de email con `check_email_domain_status`
- Si no hay dominio configurado, mostrar flujo de setup
- Si hay dominio, usar `send-transactional-email` con template nuevo `quote-sent`

**Flujo:**
1. Usuario llena modal → click "Enviar"
2. Frontend genera PDF si no existe (edge function `generate-quote-pdf`)
3. Invoca `send-transactional-email` con template `quote-sent` que incluye resumen inline + link de descarga del PDF
4. Actualiza `quotes.status = 'sent'`, `sent_at = now()`

**Nota sobre adjuntos:** El sistema de email no soporta adjuntos. Workaround: incluir link de descarga del PDF en el cuerpo del email (subir HTML a storage, generar signed URL).

---

## 4. Link Público de Aprobación — PRIORIDAD 4

**Cambios en DB:**
- Migración: agregar columna `approval_token text` y `rejection_reason text` a `quotes`
- RLS: política SELECT para `anon` role WHERE `approval_token = token` (solo lectura pública por token)
- RLS: política UPDATE para `anon` role WHERE `approval_token = token` (solo campos status, accepted_at, rejected_at, rejection_reason)

**Qué se construye:**
- Nueva página pública `src/pages/QuoteApproval.tsx` en ruta `/q/:token`
- Ruta sin auth en `App.tsx`
- Vista profesional mobile-first: logo agencia, tabla de items, totales, notas
- Botones "Aprobar" (verde) y "Rechazar" (gris con textarea)
- Al aprobar: update status + show confirmación
- Al rechazar: guardar razón + update status
- Si ya respondida o expirada: mensaje informativo

**En vista detalle de cotización:**
- Botón "Link de aprobación" genera token (`crypto.randomUUID()`), guarda en `quotes.approval_token`, copia URL al clipboard

---

## 5. Conectar Vault con Tab Credenciales del Cliente — PRIORIDAD 5

**Qué se construye:**
- En `ClientProfile.tsx`, tab "Credenciales": query `client_credentials` filtrado por `client_id`
- Reutilizar la misma UI de cards del Vault global (extraer componente compartido si es necesario)
- Botón "+ Agregar" abre modal de creación con `client_id` pre-fijado
- Acciones: revelar password, copiar, editar, eliminar

**Técnico:** Los datos ya están en `client_credentials` con `client_id` nullable. Solo falta wiring en el UI del perfil del cliente.

---

## 6. Empty States Útiles — PRIORIDAD 6

**Archivos a modificar:**
- `Clients.tsx` — empty state con ilustración + "Agregar cliente"
- `Tasks.tsx` — "Nueva tarea"
- `Quotes.tsx` — "Nueva cotización"
- `Vault.tsx` — "Agregar credencial"
- `Finances.tsx` — "Registrar pago"

Cada empty state: icono/ilustración SVG minimal, título, subtítulo explicativo, botón CTA que ejecuta la misma acción que el "+" del header.

---

## Archivos Nuevos
- `src/pages/Home.tsx`
- `src/components/tasks/TaskKanbanView.tsx`
- `src/components/quotes/SendQuoteEmailModal.tsx`
- `src/pages/QuoteApproval.tsx`
- Template de email para cotización (si se configura email domain)
- 1-2 migraciones SQL (approval_token, RLS anon)

## Dependencias Nuevas
- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

## Sin Cambios
- Admin panel, Hub, Bitácora, Settings — no se tocan

