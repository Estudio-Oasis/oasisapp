
Objetivo: dejar el flujo de invitar/reenviar 100% confiable para que no vuelva a fallar por límites de tiempo y mejorar la entregabilidad real del correo.

Diagnóstico actual (rápido):
- El dominio de envío `notify.estudiooasis.com` ya está verificado.
- Hay registros de envío `pending -> sent` para `r@estudiooasis.com`, así que la infraestructura base funciona.
- El fallo intermitente viene del límite de seguridad del proveedor de auth (“only request this after 1 seconds”) al reenviar muy seguido.
- Además, el botón de reenviar hoy permite repetir intentos casi inmediatos y eso vuelve a provocar el error.

Plan de implementación:
1) Endurecer backend de invitación/reenvío
- Refactorizar `invite-member` para separar rutas:
  - Usuario nuevo: enviar invitación normal.
  - Usuario existente: enviar link de acceso/reingreso sin doble llamada innecesaria.
- Agregar reintentos controlados para errores de rate-limit (con backoff corto y límite de intentos).
- Devolver errores estructurados (`code`, `message`, `retry_after_seconds`) para que el frontend actúe correctamente.
- Mejorar CORS headers completos para evitar fallos de preflight en distintos clientes.

2) Evitar reintentos “demasiado rápidos” desde UI
- En `MembersTab`, bloquear temporalmente “Reenviar” por invitación tras un envío exitoso (cooldown visual).
- Si backend responde rate-limit, mostrar mensaje claro en español con cuenta regresiva (“intenta en X segundos”).
- Mantener spinner por fila y deshabilitar botones mientras hay request en curso.

3) Mejorar entregabilidad del correo de auth/invitación
- Alinear el remitente del hook de correos auth para usar el dominio remitente configurado (`notify.estudiooasis.com`) de forma consistente.
- Confirmar que asunto y plantilla usados en invitaciones/reenvíos sean coherentes con el flujo (invitación vs acceso).

4) Observabilidad mínima para soporte
- Añadir logs explícitos en `invite-member` (sin secretos) para distinguir: `new_user_invite`, `existing_user_resend`, `rate_limited_retry`, `final_failure`.
- Con esto podremos diagnosticar en minutos si el problema es límite temporal, bloqueo del buzón o error real.

5) Validación end-to-end
- Probar 4 casos:
  1. Invitar email nuevo.
  2. Reenviar a email ya registrado.
  3. Clicks rápidos de reenvío (debe responder con cooldown, no romper).
  4. Confirmar en backend que cada intento termina en estado enviado o error manejado (sin 400 genérico en UI).

Detalles técnicos (archivos a tocar):
- `supabase/functions/invite-member/index.ts`
  - lógica por tipo de usuario
  - retry/backoff para rate limit
  - respuesta de error estandarizada
  - CORS headers completos
- `src/components/settings/MembersTab.tsx`
  - cooldown por invitación
  - manejo de `retry_after_seconds`
  - toasts de error más precisos
- `supabase/functions/auth-email-hook/index.ts`
  - alineación de remitente/dominio para mejor entregabilidad

Resultado esperado:
- Invitar y reenviar funciona de forma estable.
- El usuario no vuelve a ver el error de “1 second” como fallo bloqueante.
- El flujo guía cuándo reintentar y reduce rebotes por uso rápido.
