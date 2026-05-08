# Premortem — OasisOS

> Imagina que en 30 días el producto falla. ¿Qué lo causó? Riesgos priorizados por **impacto × probabilidad** con mitigaciones concretas.

## Leyenda
- **P1**: catastrófico — bloquea uso o expone datos. Mitigar ya.
- **P2**: alto — degrada confianza o conversión. Mitigar este sprint.
- **P3**: medio — deuda manejable. Backlog.

---

## P1 — Riesgos críticos

### 1. Fuga de datos cross-agency por RLS mal escrita
**Síntoma**: un usuario ve `time_entries`, `payments` o `vault_credentials` de otra agencia.
**Causa probable**: política `USING (true)` o falta de `WITH CHECK` en `INSERT/UPDATE`; nuevas tablas sin RLS.
**Mitigación**:
- CI corre `supabase--linter` semanal y bloquea merge si aparece tabla sin RLS.
- Toda tabla nueva debe usar el helper `has_agency_access(agency_id)` ya existente.
- Test manual obligatorio en cada migración de tablas: crear 2 usuarios en agencias distintas y verificar aislamiento.

### 2. Privilege escalation al rol Admin desde cliente
**Síntoma**: un member edita su `role` en `profiles` y entra a `/finances`.
**Causa**: hoy `role` vive en `profiles` (no en `user_roles` separada).
**Mitigación**:
- Migrar a tabla `user_roles` + `has_role(uid, role)` SECURITY DEFINER (estándar Lovable).
- RLS en `profiles` debe prohibir `UPDATE` de la columna `role` por el propio usuario.

### 3. Edge functions con secretos expuestos o sin auth
**Síntoma**: cualquiera invoca `create-checkout`, `invite-member` o `process-email-queue` sin sesión.
**Causa**: `verify_jwt = false` por defecto en `config.toml`.
**Mitigación**:
- Auditar `supabase/config.toml` cada función; sólo webhooks públicos deben llevar `verify_jwt = false`.
- Agregar test integración por función crítica con request anónima → debe responder 401.

---

## P2 — Riesgos altos

### 4. Rutas muertas / huérfanas reaparecen
**Síntoma**: `/timer`, `/admin`, `/superadmin` quedan accesibles sin componente, o aparecen rutas duplicadas.
**Mitigación**:
- `knip` en CI bloquea merge si detecta archivos huérfanos o exports no usados.
- Convención: una sola fuente para Bitácora (`pages/Bitacora` → `BitacoraCore`); `/timer` ya redirige.

### 5. Estados rotos del Timer (gaps, overlaps, sesión zombie)
**Síntoma**: dos `time_entries` con `end_at = null` simultáneas; o gaps al cerrar sesión.
**Causa**: trigger DB de "linear registration" depende de cliente; race conditions móvil.
**Mitigación**:
- Constraint DB: índice único parcial `WHERE end_at IS NULL` por `user_id`.
- En `TimerContext`, hacer `closeOpenEntries()` defensivo en `useEffect` al boot.
- Test e2e Playwright: iniciar A, iniciar B sin detener A → A debe cerrarse.

### 6. Auth/Onboarding loops
**Síntoma**: usuarios sin `agency_id` aterrizan en `/home` y ven 0 datos; o invitados con dominio match no hacen join.
**Mitigación**:
- `PlanRouter`/`ProtectedRoute` debe redirigir a `/onboarding` si `!agency_id` (ya implementado, **agregar test e2e**).
- Trigger `handle_new_user` debe ser idempotente (`ON CONFLICT DO NOTHING`).

### 7. Pago/Stripe — webhook fail vs polling
**Síntoma**: usuario paga, la UI no refleja Pro; o downgrade no aplica.
**Causa**: dependemos de polling `check-subscription`.
**Mitigación**:
- Llamar `check-subscription` al regresar de checkout (focus event ya existe).
- Botón "Refrescar plan" visible en `/settings` para self-service.

### 8. Realtime channels sin RLS de presencia
**Síntoma**: Hub muestra miembros de otras agencias.
**Mitigación**: filtro `agency_id` en suscripción y validación server-side en función RPC.

---

## P3 — Riesgos medios

### 9. Bundle hinchado (dead deps re-introducidas)
**Mitigación**: `knip` en CI ya detecta deps no listadas/no usadas.

### 10. Componentes duplicados (Timer/Bitácora ya consolidado)
**Mitigación**: regla en code review — ningún componente nuevo en `src/components/timer/` y `src/modules/bitacora/` simultáneamente.

### 11. i18n incompleto
**Síntoma**: mezcla ES/EN al cambiar idioma.
**Mitigación**: usar siempre `t(key)`; lint custom (futuro) que detecte strings hardcoded en JSX.

### 12. CHECK constraints inmutables que rompen restores
**Mitigación**: ya documentado — usar triggers de validación, no `CHECK (col > now())`.

### 13. Free tier sigue cargando queries de Pro
**Mitigación**: `useFeatureGate` antes de cada query de clientes/proyectos en Bitácora libre.

---

## Quality gates en CI (`.github/workflows/ci.yml`)

| Gate | Bloquea merge | Detecta |
|---|---|---|
| `prettier --check` | sí | formato inconsistente |
| `eslint` (con `unused-imports`) | sí | imports no usados, `any` warnings, dead code |
| `tsc --noEmit` | sí | errores de tipos |
| `knip` | sí | archivos huérfanos, deps no usadas, duplicados |
| `vitest run` | sí | regresiones unitarias |

## Próximos pasos recomendados
1. Migración a `user_roles` (P1 #2) — máxima prioridad.
2. Test e2e Playwright para flujos críticos: signup → onboarding → primer time entry → Pro upgrade.
3. Auditoría de `verify_jwt` en cada edge function.
