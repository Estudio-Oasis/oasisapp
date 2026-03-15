

## Plan: Optimización del flujo de estados, diferenciación visual y mejoras UX

Analizando las sugerencias del QA, estas son las que aplican directamente al estado actual del código:

### 1. Toast de confirmación al cambiar a Break/AFK/Comiendo/Reunión
**Aplica.** Actualmente `startBreakTimer` arranca silenciosamente. Agregar un toast con el mensaje "Comenzaste un break" (o el tipo correspondiente) después de iniciar el break timer en `Hub.tsx` y `TimerContext.tsx`.

### 2. Diferenciación visual de registros en Timer
**Aplica.** En `Timer.tsx`, `renderEntry` usa el mismo estilo para todo. Cambios:
- Detectar si la entrada es break/offline por `description` ("Break", "Comiendo", "AFK", "Reunión", "Offline") y `client_id === null`
- Usar icono distinto (Coffee para break, Moon para offline, Utensils para comiendo, etc.) en lugar de la barra de color del cliente
- Cambiar el color de la barra lateral: naranja para breaks, gris para offline, verde para trabajo normal
- Mostrar el label en texto más tenue/itálica para distinguirlo

### 3. Hora de fin de jornada (`work_end_hour/minute`)
**Aplica.** Migración para agregar `work_end_hour` (default 18) y `work_end_minute` (default 0) a `profiles`. Usarlo en:
- `ProfileSheet.tsx`: agregar selector de hora de fin junto al de inicio
- `Timer.tsx` `detectGaps`: no detectar gaps después de la hora de fin
- No implementar cierre automático de timer al final del día por ahora (requiere un cron/edge function más complejo), pero sí limitar la detección de gaps al rango configurado

### 4. Microinteracciones en botones de estado del Hub
**Aplica.** En `Hub.tsx`, agregar `transition-all duration-200` y un efecto `scale-95` al hacer click en los botones de estado. Ya existe la clase `hover-scale` en el proyecto.

### 5. Tooltips en iconos de estado del Hub
**Aplica.** Envolver cada botón de estado en `<Tooltip>` con una descripción breve para nuevos usuarios.

### 6. Sugerencia de llenar gaps al iniciar pausa
**No aplica ahora.** Requiere cruzar detección de gaps con el flujo de cambio de estado en tiempo real — demasiado complejo para esta iteración.

### 7. Edición rápida al detener break
**No aplica ahora.** Los breaks son registros automáticos; agregar un modal de edición post-detención añade fricción innecesaria al flujo que hoy funciona bien.

---

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| **Migración SQL** | Agregar `work_end_hour` (default 18), `work_end_minute` (default 0) a `profiles` |
| `src/components/ProfileSheet.tsx` | Agregar selectores de hora de fin de jornada |
| `src/pages/Timer.tsx` | Diferenciación visual de entries (iconos/colores por tipo). Usar `work_end_hour/minute` en gap detection |
| `src/contexts/TimerContext.tsx` | Agregar toast de confirmación en `startBreakTimer` |
| `src/pages/Hub.tsx` | Microinteracciones en botones + tooltips descriptivos |

### Resumen de lo que NO se implementa (y por qué)
- **Cierre automático de timer al fin de jornada**: requiere un cron job del lado del servidor
- **Sugerencia de llenar gaps al iniciar pausa**: complejidad alta, beneficio marginal
- **Modal de edición al detener break**: añade fricción al flujo automático

