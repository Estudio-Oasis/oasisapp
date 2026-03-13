

## Hub — Vista de equipo en tiempo real + Chat temporal

### Concepto
Nueva página `/hub` que muestra el estado en vivo de cada miembro del equipo (trabajando, en break, offline) con avatares circulares interactivos. Al hacer clic en un miembro se abre un chat temporal 1:1. Opción de pedir a la IA un resumen del chat descargable en `.txt`.

### Base de datos (3 tablas nuevas + 1 modificación)

**1. `member_presence`** — Estado en vivo de cada miembro
- `user_id` (uuid, PK, FK profiles)
- `status` (text: `working`, `break`, `offline`)
- `current_client` (text, nullable)
- `current_task` (text, nullable)  
- `last_seen_at` (timestamptz)
- `updated_at` (timestamptz)
- RLS: authenticated can SELECT all; users can UPDATE/INSERT own row
- Realtime habilitado (`ALTER PUBLICATION supabase_realtime ADD TABLE`)

**2. `chat_conversations`** — Conversaciones entre 2 personas
- `id` (uuid PK)
- `participant_a` (uuid FK profiles)
- `participant_b` (uuid FK profiles)
- `created_at`, `updated_at`
- `is_archived` (boolean default false)
- RLS: participants can SELECT/UPDATE own conversations

**3. `chat_messages`** — Mensajes del chat
- `id` (uuid PK)
- `conversation_id` (uuid FK chat_conversations)
- `sender_id` (uuid FK profiles)
- `content` (text)
- `created_at` (timestamptz)
- RLS: participants of the conversation can SELECT/INSERT
- Realtime habilitado

### Presencia automática
- En `TimerContext`, al iniciar/detener timer → upsert `member_presence` con status `working`/`break` y datos de cliente/tarea actuales.
- Heartbeat cada 60s mientras hay timer activo.
- Si `last_seen_at` > 5 min → se muestra como `offline` en el frontend.

### UI — Página Hub (`src/pages/Hub.tsx`)

```text
┌─────────────────────────────────────────┐
│  Hub                                    │
│  Actividad del equipo                   │
│                                         │
│  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐         │
│  │RA│  │MG│  │JL│  │DP│  │ ··│         │
│  └──┘  └──┘  └──┘  └──┘  └──┘         │
│  Rosa   Marco  Juan  Diana              │
│  🟢     🟠     ⚫    🟢                 │
│  Acme   Break  Off   Beta Inc           │
│  "Diseño" ""   ""    "Landing"          │
│                                         │
│  ─── Chats ────────────────────         │
│  💬 Rosa · hace 5m                      │
│  💬 Marco · ayer                        │
└─────────────────────────────────────────┘
```

- Círculos con avatar/iniciales + borde de color según estado (verde=working, ámbar=break, gris=offline)
- Debajo: nombre, cliente actual, tarea actual
- Click en un avatar → abre panel de chat (Sheet lateral derecho)
- Sección inferior: lista de chats existentes

### UI — Chat Panel (Sheet lateral)
- Mensajes en tiempo real via Supabase Realtime
- Input de texto minimalista
- Botón "Resumir con IA" → llama edge function que usa Lovable AI (gemini-3-flash-preview) para generar resumen → descarga `.txt`
- Chat queda guardado y accesible desde la lista de chats

### Edge Function — `summarize-chat`
- Recibe `conversation_id`
- Consulta todos los mensajes
- Llama a Lovable AI Gateway con prompt de resumen en español
- Retorna texto plano del resumen

### Navegación
- Agregar "Hub" a `AppSidebar` y `BottomNav` (icono: `Radio` o `Waypoints` de lucide)
- Agregar ruta `/hub` en `App.tsx`

### Archivos a crear/editar
| Archivo | Acción |
|---|---|
| Migración SQL | Crear 3 tablas + realtime |
| `src/pages/Hub.tsx` | Nueva página principal |
| `src/components/hub/MemberBubble.tsx` | Componente de avatar con estado |
| `src/components/hub/ChatPanel.tsx` | Sheet de chat con mensajes realtime |
| `src/components/hub/ChatList.tsx` | Lista de conversaciones existentes |
| `supabase/functions/summarize-chat/index.ts` | Edge function resumen IA |
| `src/contexts/TimerContext.tsx` | Agregar upsert de presencia |
| `src/components/AppSidebar.tsx` | Agregar nav item Hub |
| `src/components/BottomNav.tsx` | Agregar nav item Hub |
| `src/components/AppLayout.tsx` | Agregar título "Hub" |
| `src/App.tsx` | Agregar ruta `/hub` |

### Estilo visual
- Misma paleta monocromática + ámbar para estados activos
- Sin sombras, solo bordes 1px
- Avatares con `getClientColor()` para fallback de color
- Animación sutil de pulso en el borde del avatar cuando está `working`

