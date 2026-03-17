# Plan: Launch Readiness — De "seguimos diseñando" a "ya tiene usuarios"

## Lo que ya está cerrado de la landing

La landing actual ya cubre la estructura acordada: Hero con Bitácora dominante, Problema, Para quién, 3 Funciones con jerarquía, Admins, Individuos, Cómo funciona, Vista del sistema, CTA final, Footer. **La doy por cerrada** con solo 2 ajustes menores:

1. **Landing: mención sutil de IA como roadmap** — Agregar una línea en la sección "Vista del sistema" tipo: *"La experiencia seguirá mejorando con resúmenes inteligentes y automatizaciones."* Sin prometer features específicos.
2. **Landing: link de feedback en footer** — Agregar un link "¿Ideas o feedback?" que abra un mailto o formulario simple.

Nada más en la landing. Ya es compartible.

---

## Flujo público completo

```text
Landing (/) 
  → "Probar Bitácora gratis" → /bitacora-demo (sin auth, localStorage)
    → Usa producto, registra actividad
    → DeferredCTA aparece tras 2 entries → "Crear cuenta"
    → /signup?from=demo (migra entries automáticamente)
    → /bitacora (cuenta real, datos persistidos)

Landing (/)
  → "Crear cuenta gratis" → /signup → /bitacora
  → "Iniciar sesión" → /login → /bitacora
```

Este flujo **ya existe y funciona**. Lo que falta es pulirlo.

---

## Cambios concretos por archivo (7 archivos)

### 1. `src/pages/Login.tsx` — Branding Bitácora + español

- Logo "OS" → wordmark "Bitácora"
- "Welcome back" → "Bienvenido de vuelta"
- "Sign in to your workspace" → "Inicia sesión en Bitácora"
- Labels → español (Correo, Contraseña)
- Button → "Iniciar sesión"
- Footer → "¿No tienes cuenta? Regístrate"

### 2. `src/pages/Signup.tsx` — Branding Bitácora

- Logo "OS" → wordmark "Bitácora" (líneas 67-69)

### 3. `src/modules/bitacora/StandaloneShell.tsx` — Branding + feedback

- Logo "OS" → wordmark "Bitácora" (mini onboarding línea 46-48 + header línea 156-158)
- "Volver a Oasis" → "Volver al inicio" (líneas 39-43, 149-154)

### 4. `src/modules/bitacora/BitacoraCore.tsx` — Dos caminos de registro

- Líneas 120-129: Cuando no hay sesión activa y `!hideQuickLog`, debajo del QuickLogInput agregar dos botones visibles:
  - "Iniciar actividad" (accent) → abre QuickSheet
  - "Agregar registro manual" (outline) → abre modal manual
- Líneas 198-209: Eliminar el link pequeño de "Manual" (10px)

### 5. `src/components/timer/TimeEntryRow.tsx` — Clickable con affordance

- Agregar prop `onClick?: () => void`
- Envolver en div clickable con `cursor-pointer hover:bg-background-secondary/50 rounded-lg transition-colors`
- Agregar `ChevronRight` sutil al final del row

### 6. `src/components/timer/ActivityConstants.ts` — Copy literal

- `UI_COPY.btnSwitch` → `"Cambiar actividad"`
- `UI_COPY.btnManualEntry` → `"Agregar registro manual"`
- `UI_COPY.sessionNoClient` → `"Sin cliente asociado"`

### 7. `src/pages/Settings.tsx` — Experiencia free individual

- Importar `usePlan`
- Si `!agency && isFree`: mostrar perfil individual básico (nombre, email, horario, plan) en vez de `CreateAgencyPrompt`
- Si `!agency && isPro`: mantener `CreateAgencyPrompt` con copy "Crea tu equipo"
- Si `agency`: flujo actual con tabs, traducir headers a español

### 8. `src/components/OnboardingChecklist.tsx` — 2 pasos free

- Importar `usePlan`
- Free: 2 items → "Completa tu perfil" + "Registra 30 minutos" (sin "Crea tu primera tarea" que requiere módulo pro)
- Pro: items actuales

### 9. `src/pages/Landing.tsx` — Ajustes mínimos de cierre

- Línea sutil de roadmap en SystemView: "La experiencia seguirá mejorando con resúmenes inteligentes y automatizaciones."
- Link de feedback en Footer: "¿Ideas o feedback?" → mailto o widget simple

---

## IA: tratamiento honesto sin bloquear

No se menciona IA como feature en ninguna parte del producto hoy. Solo una línea sutil en la landing (Vista del sistema) como roadmap. No promete nada específico. No bloquea lanzamiento.

## Feedback: mecanismo simple

Un link "¿Ideas o feedback?" en:

- Footer de la landing
- Header del StandaloneShell (demo)
- Dentro de Bitácora autenticada (en la zona de settings o como link discreto)

Implementado como `mailto:feedback@estudiooasis.com` o un link a un formulario externo (Typeform, Google Forms). Sin necesidad de base de datos adicional.

## Definición de "listo para lanzar"

1. ✅ Landing compartible con CTAs claros
2. ✅ Demo funcional sin auth
3. ✅ Signup/login con branding coherente
4. ✅ Migración demo→cuenta funcional
5. ✅ Bitácora usable con dos caminos de registro
6. ✅ Entries editables desde el feed
7. ✅ Onboarding apropiado por plan
8. ✅ Settings que no confundan al usuario free
9. ✅ Forma básica de recibir feedback
10. ✅ IA no mencionada como feature activa

---

## Orden de ejecución

1. **Login + Signup + StandaloneShell** — branding Bitácora (3 archivos en paralelo)
2. **BitacoraCore + TimeEntryRow + ActivityConstants** — UX de producto (3 archivos en paralelo)
3. **Settings + OnboardingChecklist** — experiencia free (2 archivos en paralelo)
4. **Landing** — ajustes mínimos de cierre (1 archivo)

Total: 9 archivos, 0 cambios de base de datos, 0 edge functions nuevas.  
  
Sí: **esto ya está muy bien enfocado**.  
De hecho, este plan ya no suena a “seguimos diseñando”, sino a **cerrar lo mínimo necesario para empezar a meter usuarios reales**.

## Mi veredicto

Yo lo pondría en **9.7/10**.

Lo aprobaría, con solo **3 ajustes finos** antes de que ejecute.

---

## Lo que está muy bien

### 1. Ya cerró correctamente la landing

Me gusta que no quiera reabrir estrategia de landing y solo deje:

- una mención sutil de IA
- un canal simple de feedback

Eso es correcto.  
A esta altura ya no conviene reescribir más la narrativa.

### 2. El funnel público ya está claro

Esto está bien resuelto:

- landing
- demo sin auth
- CTA diferido
- signup
- migración al producto real

Ese flujo ya tiene lógica de adopción real.

### 3. La prioridad de producto es correcta

También está bien que el foco esté en:

- branding coherente
- Bitácora usable
- dos caminos claros de registro
- settings free sin confusión
- onboarding simple

Eso sí mueve la aguja para un lanzamiento.

### 4. La IA quedó tratada con madurez

Bien que no la estén usando como humo.  
La línea sutil de roadmap basta por ahora.

### 5. Feedback simple

Esto también está bien.  
No hace falta construir sistema de feedback complejo todavía.

---

## Los 3 ajustes que yo haría antes de ejecutar

## 1. El feedback no lo dejaría solo en `mailto`

Aquí sí mejoraría la propuesta.

Un `mailto:` es mejor que nada, pero tiene problemas:

- mucha gente no tiene cliente de correo configurado
- se siente poco fluido
- reduce la tasa real de feedback

## Mejor opción

Yo le pediría esto:

- **preferir formulario externo simple** (Typeform, Tally o Google Form)
- dejar `mailto:` solo como fallback si no hay otra cosa

### Mi recomendación

Que el link de “¿Ideas o feedback?” apunte a un formulario corto, no a email.

---

## 2. En `StandaloneShell` yo también pondría un CTA sutil a crear cuenta

No solo branding y feedback.

Si la demo ya sirve como puerta de entrada, debería haber un punto claro, sutil y constante para pasar a cuenta real.

No invasivo.  
Pero sí visible.

### Algo como:

- **Guardar mi progreso**
- **Crear cuenta gratis**
- **Seguir con mi Bitácora**

Especialmente después de que el usuario ya registró algo.

Si eso ya existe por el DeferredCTA, perfecto, pero yo lo validaría visualmente dentro de esta fase para asegurar que no queda escondido.

---

## 3. “Listo para lanzar” necesita una validación final más concreta

La definición está bien, pero yo le agregaría una checklist más operativa.

Antes de decir “salimos”, yo validaría explícitamente:

### Checklist de salida

- landing carga bien en desktop y mobile
- demo inicia sin confusión
- se puede registrar con timer
- se puede registrar manualmente
- editar entries desde feed funciona
- signup desde demo funciona
- migración demo → cuenta funciona
- login lleva a la experiencia correcta
- user free no ve prompts raros de equipo/agencia
- feedback link funciona
- CTAs principales son visibles y claros

No como estrategia, sino como QA de salida.

---

## Lo que le respondería yo a Lovable

Pégale esto:

```text
Va muy bien. Esta dirección ya es correcta para launch readiness y sí quiero que ejecutes.

Solo ajusta estas 3 cosas antes de arrancar:

1. No quiero que el feedback quede solo en `mailto:`. Prefiero que “¿Ideas o feedback?” apunte a un formulario externo simple (Typeform, Tally o Google Form). `mailto:` puede quedar solo como fallback.

2. En la experiencia demo / StandaloneShell, asegúrate de que también exista un camino claro y visible hacia crear cuenta o guardar progreso, además del branding. Quiero que el paso de demo a cuenta real se sienta natural.

3. Antes de cerrar esta iteración, quiero una validación final tipo launch checklist: landing, demo, registro manual, timer, edición desde feed, signup/login, migración demo→cuenta, experiencia free y feedback funcionando.

Fuera de eso, sí puedes ejecutar en el orden que planteaste.

```

---

## Conclusión

Sí: **ya están en etapa de lanzamiento, no de exploración**.  
Yo ya no abriría nuevos frentes. Haría esos tres ajustes y lo pondría a construir.