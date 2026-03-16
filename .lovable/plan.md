

## Diagnóstico del problema

Hay **3 bugs interconectados** que causan que las actividades no se registren correctamente:

### Bug 1: `startBreakTimer` no detiene la sesión activa primero
Cuando tocas "Descanso" desde el QuickSheet, se llama `startQuickAction("break")` → `timer.startBreakTimer("break")`. Pero `startBreakTimer` **no llama a `stopTimer()` antes de insertar la nueva entrada**. Resultado: quedan dos `time_entries` abiertas simultáneamente (la anterior y el break), y como el query del feed filtra solo entradas con `ended_at` (completadas), la anterior nunca aparece cerrada.

En contraste, `switchTask` sí llama `stopTimer()` antes de `startTimer()`.

### Bug 2: `startTimer` tampoco detiene la sesión activa
Si hay un timer corriendo y llamas `startTimer` directo (como hace `startQuickAction` para "Reunión" y "Pendientes"), también se crea una entrada nueva sin cerrar la anterior.

### Bug 3: El QuickSheet en modo "start" no verifica si ya hay sesión activa
Cuando el QuickSheet está en modo `start` y ya hay un timer corriendo, llama `bita.startActivity` que va a `timer.startTimer` — de nuevo sin detener primero.

### Consecuencia
Las entradas de break/descanso se crean en la DB pero la entrada anterior queda sin `ended_at`, y el break mismo nunca se cierra porque al siguiente `startTimer` tampoco lo cierra. Resultado: los breaks "desaparecen" del feed.

---

## Plan de corrección

### 1. Fix `startBreakTimer` — detener sesión activa antes de crear break
En `TimerContext.tsx`, agregar `await stopTimer()` al inicio de `startBreakTimer` si hay una sesión activa.

### 2. Fix `startTimer` — detener sesión activa antes de crear nueva
En `TimerContext.tsx`, agregar `await stopTimer()` al inicio de `startTimer` si hay una sesión activa. Esto hace que `switchTask` sea redundante (pero se mantiene por compatibilidad).

### 3. Ajustar `startQuickAction` en `OasisBitacoraProvider`
Asegurar que si hay sesión activa, se detenga antes de iniciar el break/reunión. Con el fix en `startBreakTimer` y `startTimer` esto ya se resuelve a nivel de TimerContext.

---

## Sobre los otros pedidos del usuario

### Session sharing
Ya existe parcialmente con `member_presence`. El user quiere poder "compartir" una sesión activa (ej: que otro miembro vea qué estás haciendo). Esto ya funciona vía el Hub. No requiere cambios inmediatos.

### Push notifications
Requiere implementar un Service Worker + Web Push API o usar Capacitor para notificaciones nativas. Esto es un feature separado que se puede planear después del fix crítico. Se necesitaría:
- Registrar un service worker
- Pedir permiso de notificaciones
- Crear un edge function que envíe notificaciones en momentos clave (gaps detectados, fin de jornada sin registro, etc.)

### Registro offline
Ya existe `startBreakTimer("offline")` que crea una entrada "Offline". El heartbeat detecta cuando vuelves online y cierra esa entrada. Este flujo ya funciona si el bug de stop-before-start se corrige.

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/contexts/TimerContext.tsx` | `startTimer`: llamar `stopTimer()` si hay sesión activa. `startBreakTimer`: llamar `stopTimer()` si hay sesión activa. |

Es un fix de ~6 líneas en total que resuelve el problema raíz.

