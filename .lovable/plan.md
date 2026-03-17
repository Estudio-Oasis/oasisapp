

# Plan: Percepción de valor — Timeline 24h, Explore poblado, Timer vivo, Copy, Dictado + IA

## 1. Timeline de 24 horas completa

**Archivo:** `src/components/timer/DayTimeline.tsx`

Cambio fundamental: ignorar los props `workStartHour`/`workEndHour` para la visualización. La timeline siempre muestra 00:00–23:59.

- `dayStart` = 00:00, `dayEnd` = 23:59
- Hour markers cada 2–3 horas (00, 03, 06, 09, 12, 15, 18, 21, 00) para no saturar labels
- En mobile mostrar aún menos labels (cada 4h)
- Los bloques de entries/gaps se posicionan en escala de 24h
- El needle de "ahora" siempre es visible
- Los props de `workStart`/`workEnd` se mantienen en la interfaz por compatibilidad pero ya no limitan el rango visual

**Archivo:** `src/modules/bitacora/BitacoraCore.tsx` (líneas 168-177) — ya no necesita pasar `workStartHour`/`workEndHour` al timeline (o puede seguir pasándolos sin efecto visual).

## 2. Bloque provisional vivo (sesión activa)

**Archivo:** `src/components/timer/DayTimeline.tsx`

- Nuevo prop opcional: `activeSession?: { startedAt: string; description?: string | null; clientName?: string | null; clientId?: string | null }`
- Cuando existe, inyectar un bloque "fantasma" desde `activeSession.startedAt` hasta `now` con color accent y `animate-pulse`
- Se renderiza como un bloque más en la barra, pero con estilo diferenciado

**Archivo:** `src/modules/bitacora/BitacoraCore.tsx`

- Pasar `activeSession` al `DayTimeline` cuando `bita.isRunning` es true
- Arriba del feed de entries (línea ~190), mostrar una card "En progreso" con dot pulsante + elapsed time + descripción, solo cuando hay sesión activa

## 3. Explore mode siempre poblado

**Archivo:** `src/modules/bitacora/demo/mockExploreData.ts`

- Eliminar el filtro de líneas 62-67 que filtra por hora actual
- Retornar siempre todas las entries (las 14 actuales)
- Reducir a ~8-10 si visualmente se siente mejor: quitar las más redundantes (ej: mantener 1 break en vez de 2, quitar "Cosas varias" si no aporta)

## 4. Copy actualizado

**Archivo:** `src/modules/bitacora/demo/TodoPanel.tsx`
- Línea 163: `"¿Qué necesitas hacer hoy?\nAnota o dicta tus pendientes en el orden que quieras. Después podrás detallarlos."`
- Línea 213: `"Puedes dictar, pegar o escribir varios"`

**Archivo:** `src/modules/bitacora/demo/QuickStartPanel.tsx`
- Línea 92: `"Escribe o dicta lo que estás haciendo…"`

**Archivo:** `src/modules/bitacora/BitacoraQuickSheet.tsx`
- Placeholder del input principal → `"Escribe o dicta lo que estás haciendo…"`

## 5. Dictado nativo (Web Speech API)

Nuevo hook: `src/hooks/useSpeechRecognition.ts`
- Wrappea `webkitSpeechRecognition` / `SpeechRecognition`
- Expone: `{ isListening, transcript, startListening, stopListening, isSupported }`
- Idioma: `es-MX`
- Maneja permisos y errores silenciosamente

Integrar en (por orden de prioridad):
1. `src/modules/bitacora/demo/QuickStartPanel.tsx` — botón `Mic` junto al botón Play dentro del input
2. `src/modules/bitacora/BitacoraQuickSheet.tsx` — botón `Mic` junto al input principal
3. `src/modules/bitacora/demo/TodoPanel.tsx` — botón `Mic` junto al textarea

UX: botón solo visible si `isSupported`. Estado escuchando = icono cambia a `MicOff` con color accent. Al parar, texto se inserta en el input.

## 6. IA ligera para refinar descripción

**Nuevo archivo:** `src/components/timer/AiRefineButton.tsx`
- Botón `Sparkles` que aparece cuando hay texto en el input (>5 chars)
- Al tocar: llama a `supabase.functions.invoke("rewrite-description", { body: { text } })` (edge function ya existente)
- Muestra sugerencia inline debajo del input con "Aceptar" / "Descartar"
- Loading state sutil

Integrar en:
1. `QuickStartPanel.tsx` — después del input
2. `BitacoraQuickSheet.tsx` — después del input

No en TodoPanel por ahora (es P2).

## Orden de ejecución

1. **Timeline 24h + bloque provisional** — DayTimeline.tsx + BitacoraCore.tsx
2. **Explore mode** — mockExploreData.ts
3. **Copy** — TodoPanel + QuickStartPanel + BitacoraQuickSheet
4. **Dictado** — useSpeechRecognition hook + 3 integraciones
5. **IA refine** — AiRefineButton + 2 integraciones

## Archivos nuevos
- `src/hooks/useSpeechRecognition.ts`
- `src/components/timer/AiRefineButton.tsx`

## Archivos editados
- `src/components/timer/DayTimeline.tsx`
- `src/modules/bitacora/BitacoraCore.tsx`
- `src/modules/bitacora/demo/mockExploreData.ts`
- `src/modules/bitacora/demo/TodoPanel.tsx`
- `src/modules/bitacora/demo/QuickStartPanel.tsx`
- `src/modules/bitacora/BitacoraQuickSheet.tsx`

0 cambios de base de datos. 0 edge functions nuevas. Usa `rewrite-description` existente.

