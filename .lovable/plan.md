## Objetivo

Hacer descubrible el Centro de Comando para super-admins con tres ayudas visuales: tour inicial, breadcrumb persistente y pulso de atención.

## 1. Mini-tour de primera vez (super-admin)

Nuevo componente `src/components/comando/CommandCenterTour.tsx`:
- Overlay ligero (no bloqueante) con 2-3 tarjetas paso a paso usando `Popover`/posicionamiento absoluto.
- Pasos:
  1. **Desktop**: apunta al chip "Comando" en la parte superior del sidebar (halo ámbar + flecha).
  2. **Móvil**: apunta a la tarjeta hero "Centro de comando" en `/mas`.
  3. Cierre con CTA "Ir a Comando" o "Omitir".
- Detecta viewport (`md:` breakpoint) para mostrar solo el paso relevante al dispositivo actual; desktop muestra ambos por contexto.
- Persistencia: `localStorage["oasis.commandTour.dismissed"] = "1"` al pulsar **Omitir** o **Entendido**. No vuelve a mostrarse.
- Trigger: se monta en `AppLayout` y se renderiza solo si `isSuperAdmin && !dismissed && !location.pathname.startsWith("/comando")`. Aparece a los ~1.5s tras el primer login (delay para no chocar con otros toasts).

Hook `useCommandTour()` que expone `{ shouldShow, dismiss, isSuperAdmin }`. Reusa la consulta `super_admin_users` ya cacheada.

## 2. Breadcrumb visible en /comando

En `AppLayout.tsx`:
- Añadir un sub-header compacto (alto ~36px, fondo `bg-muted/40`, borde inferior) que se renderiza **solo cuando** `location.pathname.startsWith("/comando")`.
- Contenido: `Radar` icon ámbar + `Inicio › Centro de Comando` + badge "LIVE" (pulse dot ámbar). Link `Inicio` vuelve a `/`.
- Visible tanto en desktop como móvil (sustituye el header compacto móvil cuando aplica para no duplicar).

## 3. Pulso/halo temporal en el chip "Comando"

- En `AppSidebar.tsx` (chip desktop) y `Mas.tsx` (hero móvil): añadir clase condicional `animate-pulse-halo` durante los primeros **6 segundos** al montar la ruta `/tasks` o `/mas`.
- Implementación: `useEffect` con `setTimeout(6000)` que togglea un estado `highlight`. Solo se activa una vez por sesión (`sessionStorage["oasis.commandPulse.shown"]`).
- Halo: ring ámbar `ring-2 ring-accent/60` + sombra animada (`shadow-[0_0_24px_hsl(var(--accent)/0.5)]`) con keyframe `pulse-halo` añadido a `tailwind.config.ts`.
- Si el usuario ya hizo dismiss del tour, igual mantenemos el pulso (refuerzo pasivo).

## Detalles técnicos

- Animación nueva en `tailwind.config.ts`:
  ```text
  keyframes: pulse-halo { 0%,100%: ring-opacity .3 ; 50%: ring-opacity .8 + shadow expand }
  animation: pulse-halo: pulse-halo 1.6s ease-in-out infinite
  ```
- Sin cambios de DB ni de lógica de negocio. Todo presentación/UI.
- Sin nuevas dependencias.

## Archivos a modificar/crear

- `src/components/comando/CommandCenterTour.tsx` (nuevo)
- `src/hooks/useCommandTour.ts` (nuevo)
- `src/components/AppLayout.tsx` (sub-header breadcrumb + montar tour)
- `src/components/AppSidebar.tsx` (pulso temporal en chip)
- `src/pages/Mas.tsx` (pulso temporal en hero)
- `tailwind.config.ts` (keyframe pulse-halo)

## Criterios de aceptación

- Super-admin nuevo ve el tour una sola vez; "Omitir" no lo vuelve a mostrar.
- En `/comando` siempre hay un breadcrumb visible identificando la sección.
- Al entrar a `/tasks` o `/mas` por primera vez en la sesión, el chip/hero "Comando" pulsa ~6s y luego se calma.
- No afecta a usuarios que no son super-admin.
