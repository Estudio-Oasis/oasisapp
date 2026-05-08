
# Perfil completo — estándar moderno (Linear / Notion / Vercel)

Hoy `ProfileSheet` solo permite editar nombre, foto, puesto y contraseña. Falta lo básico: email, idioma, tema, zona horaria, notificaciones, sesión activa y eliminar cuenta. Vamos a convertirlo en un panel profesional, organizado por secciones colapsadas tipo acordeón/tabs.

## Estructura nueva (3 pestañas dentro del Sheet)

```
Mi perfil
├─ Cuenta         ← personal, identidad
├─ Preferencias   ← idioma, tema, horario, notificaciones
└─ Equipo         ← (solo admin) miembros + invitaciones
```

Footer fijo: "Cerrar sesión" y "Eliminar cuenta" (zona peligro colapsada).

## Tab 1 — Cuenta

- **Avatar** con upload (ya existe) + botón "Quitar foto".
- **Nombre completo** (ya existe).
- **Puesto / Rol funcional** (ya existe).
- **Email** ✱ nuevo — editable con `supabase.auth.updateUser({ email })`. Muestra estado: "Verificado" o "Pendiente de verificar". Banner de aviso de que se enviará correo de confirmación al nuevo email.
- **Teléfono** ✱ nuevo (opcional, columna `profiles.phone` si existe; si no, lo añadimos a profiles).
- **Bio corta** ✱ nuevo (opcional, `profiles.bio` text, máx 160 chars).
- **Cambiar contraseña** (ya existe) en sub-bloque colapsable.
- **Info read-only**: ID de usuario, fecha de creación de cuenta, último login, agencia a la que pertenece.

## Tab 2 — Preferencias

- **Idioma** — selector ES / EN (ya hay `LanguageContext`, conectarlo aquí).
- **Tema** — Sistema / Claro / Oscuro con `next-themes` (ya importado, falta exponer UI).
- **Zona horaria** — select con detección automática de `Intl.DateTimeFormat().resolvedOptions().timeZone`, guardar en `profiles.timezone`.
- **Horario de trabajo** (ya existe — moverlo aquí).
- **Notificaciones** — switches:
  - Email: resúmenes diarios, menciones en chat, recordatorios de tareas, novedades del producto.
  - In-app: bell de notificaciones, sonidos.
  Guardar en `profiles.notification_preferences jsonb`.
- **Inicio de semana** — Lunes / Domingo.

## Tab 3 — Equipo (admin)

(Mantener lo que ya existe: invitaciones pendientes, miembros, toggle rol).

## Zona de peligro (footer colapsable)

- **Cerrar sesión** (ya existe).
- **Cerrar sesión en todos los dispositivos** — `supabase.auth.signOut({ scope: 'global' })`.
- **Eliminar cuenta** — modal de confirmación pidiendo escribir el email para confirmar. Llama edge function `delete-account` (a crear) que:
  1. Verifica que el usuario no sea único admin de la agencia (si lo es, bloquear con instrucción de transferir o eliminar agencia primero).
  2. Borra `profiles` (cascade hace el resto).
  3. Borra `auth.users` con service role.

## Cambios técnicos

### 1. Migración DB
Añadir a `profiles`:
- `phone text`
- `bio text`
- `timezone text default 'America/Mexico_City'`
- `notification_preferences jsonb default '{"email_daily_summary":true,"email_mentions":true,"email_task_reminders":true,"email_product_updates":false,"inapp_sounds":true}'`
- `week_start_day int default 1` (1=lunes, 0=domingo)

### 2. Edge function `delete-account`
Nueva función con `verify_jwt = true` que recibe confirmación, valida sole-admin, borra profile y user.

### 3. Componentes
- Refactor `ProfileSheet.tsx` para usar `<Tabs>` (ya existe en shadcn).
- Sub-componentes nuevos: `ProfileTabAccount.tsx`, `ProfileTabPreferences.tsx`, `ProfileTabTeam.tsx`, `DangerZone.tsx`, `ChangeEmailDialog.tsx`, `DeleteAccountDialog.tsx`.
- Ancho del Sheet: pasar de 380px a 480px en desktop (mantener 100% en móvil).

### 4. Dependencias frontend
Reusar `Tabs`, `Switch`, `Select`, `Dialog` (todos ya en el proyecto). Sin paquetes nuevos.

## Premortem (puntos a vigilar)

| Riesgo | Mitigación |
|---|---|
| Cambio de email rompe sesión activa | Usar flow estándar de Supabase: confirma desde correo, mantiene sesión. Mostrar mensaje "Revisa tu bandeja". |
| Único admin se elimina y agencia queda huérfana | Edge function bloquea con error claro. |
| Toggle de notificaciones sin backend que las consuma | Guardar preferencias ahora; los edge functions de email respetan el flag (`process-email-queue` ya filtra por `unsubscribes` — extender a `notification_preferences`). |
| Tabs largos en móvil | Sheet con scroll vertical interno por tab. |

## Resultado visible

El usuario abre "Mi perfil" y encuentra un panel profesional con 3 pestañas. Puede cambiar email, idioma, tema, zona horaria, horario, notificaciones, cerrar sesión global y eliminar cuenta. Equiparable a Linear/Notion.

¿Apruebas el plan o quieres ajustar alcance (p.ej. omitir eliminar cuenta o teléfono/bio en esta iteración)?
