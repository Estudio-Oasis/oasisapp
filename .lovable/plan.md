

# Sprint 13: Perfil Económico + Inteligencia de Valor Hora

## Gap Analysis — Lo que YA existe vs lo que FALTA

| Concepto PRD | Estado |
|---|---|
| Timer + registro de actividad | ✅ Completo |
| Clientes con monthly_rate | ✅ Completo |
| Cotizaciones con PDF + pricing assistant | ✅ Completo |
| Finanzas (pagos, facturas, gastos) | ✅ Completo |
| Horario trabajo (start/end hour) | ✅ Parcial (solo inicio/fin, no días) |
| Perfil tipo (freelancer/founder) | ✅ Se captura en onboarding pero NO se guarda en DB |
| **Ingreso mensual objetivo** | ❌ No existe |
| **Ingreso mínimo aceptable** | ❌ No existe |
| **Horas disponibles por semana** | ❌ No existe (se infiere de work hours pero no es explícito) |
| **Días laborales** | ❌ No existe |
| **Valor hora calculado** | ❌ No existe |
| **Costos operativos personales** | ❌ No existe |
| **Dashboard de progreso vs objetivo** | ❌ Solo hay barra de horas/día, no de dinero |
| **Valor económico en vivo en timer** | ❌ No existe |
| **Insights de rentabilidad por cliente** | ⚠️ Parcial (RateBreakdown existe pero no compara vs objetivo) |
| **Behavioral insights** | ❌ No existe |

## Plan de implementación — Sprint 13

### 1. Migración de DB — Campos económicos en `profiles`

Agregar a la tabla `profiles`:
- `income_target` (numeric, nullable) — ingreso mensual objetivo
- `income_minimum` (numeric, nullable) — ingreso mínimo aceptable
- `income_currency` (text, default 'MXN') — moneda del objetivo
- `available_hours_per_week` (numeric, nullable) — horas disponibles reales
- `work_days` (text[], default '{mon,tue,wed,thu,fri}') — días laborales
- `profile_type` (text, nullable) — freelancer/founder/employee/other

Crear función SQL `calculate_hourly_rates(user_id uuid)` que retorne:
- `rate_minimum` = income_minimum / (available_hours_per_week * 4.33)
- `rate_target` = income_target / (available_hours_per_week * 4.33)
- `rate_premium` = rate_target * 1.3

### 2. Settings — Sección "Mi Economía"

Expandir `FreeProfileView` en Settings con una nueva sección colapsable:

**"Tu modelo económico"**
- Ingreso mensual objetivo (input numérico + selector moneda)
- Ingreso mínimo aceptable
- Horas disponibles por semana
- Días laborales (chips seleccionables: L M Mi J V S D)
- Tipo de perfil (chips: Freelancer / Fundador / Empleado / Otro)

Debajo, mostrar automáticamente un card con los 3 valores hora calculados:
```
Valor hora mínimo: $187/hr
Valor hora objetivo: $312/hr  
Valor hora premium: $406/hr
```

### 3. Onboarding — Capturar objetivo económico

Agregar al Step 1 del OnboardingWizard (después de perfil tipo):
- "¿Cuánto quieres ganar al mes?" — input numérico simple
- "¿Cuántas horas quieres trabajar por semana?" — slider o input (default 40)

Esto se guarda en profiles al crear la agencia. Mínimo viable, sin intimidar.

### 4. Home Dashboard — Widget de Progreso Económico

Nuevo widget `MonthProgressWidget`:
- Barra de progreso: "Llevas $X de $Y este mes" (basado en pagos recibidos vs income_target)
- Valor hora real este mes = pagos del mes / horas trabajadas del mes
- Comparación visual: valor hora real vs objetivo (verde si arriba, rojo si abajo)
- Solo aparece si el usuario tiene `income_target` configurado

### 5. Timer — Equivalente económico en vivo

En `ActiveSessionCard`, agregar línea:
- "💰 ~$X" calculado como: elapsed_seconds / 3600 * rate_target
- Solo visible si el usuario tiene income_target configurado
- Sutil, no intrusivo — texto pequeño debajo del tiempo

### 6. Guardar `profile_type` del onboarding

El onboarding ya captura `profileType` pero no lo persiste. Guardarlo en el nuevo campo `profile_type` de profiles.

---

## Archivos a editar
- **Migración SQL**: nuevos campos en profiles + función calculate_hourly_rates
- `src/pages/Settings.tsx` — expandir FreeProfileView con sección económica
- `src/components/OnboardingWizard.tsx` — agregar income_target y available_hours al step 1
- `src/pages/Home.tsx` — nuevo MonthProgressWidget
- `src/components/timer/ActiveSessionCard.tsx` — mostrar equivalente económico
- `src/hooks/useHourlyRate.ts` — nuevo hook que calcula y expone los rates

## Sin archivos nuevos de página
Todo se integra en componentes existentes.

