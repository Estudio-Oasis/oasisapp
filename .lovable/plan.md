
# Separar Estudio Oasis (corporativo) de OasisOS (producto)

Estrategia: **Remix** del proyecto actual → en el remix queda solo el sitio corporativo; en el proyecto original queda solo la app OasisOS. La landing `/oasis-os` se duplica en ambos para SEO y captación.

## Paso 1 — Tú: crear el remix (manual, fuera del chat)

1. En el dashboard de Lovable, clic en los tres puntos (⋯) del proyecto actual → **Remix**.
2. Nombra el remix algo como **"Estudio Oasis — Sitio corporativo"**.
3. Una vez creado, abre el remix y desde ahí me pides "limpia este proyecto dejando solo el sitio corporativo" (usaré el plan de abajo).
4. Vuelves a este proyecto (el original) y me pides "limpia este proyecto dejando solo la app OasisOS".

No puedo crear el remix yo — es una acción de UI tuya.

## Paso 2 — Limpieza del REMIX (sitio corporativo)

**Conservar:**
- Páginas: `Landing`, `AboutRoger`, `AboutStudio`, `Servicios`, `Portfolio`, `Contacto`, `OasisOS`, `AvisoPrivacidad`, `Unsubscribe`, `QuoteApproval`, `NotFound`.
- Componentes: `SiteNavbar`, `SiteFooter`, `RogerContactFab`, `ui/*` que se usen en esas páginas.
- Assets: imágenes de marca, portfolio, product-* (para la landing de OasisOS).
- Edge functions: `send-transactional-email`, `process-email-queue`, `handle-email-suppression`, `handle-email-unsubscribe`, `preview-transactional-email`, `auth-email-hook` (para signup más adelante si quieres), plantillas `contact-*`.
- Supabase: tablas `analytics_events`, `email_send_log`, `email_send_state`, `email_unsubscribe_tokens`, `suppressed_emails`, `quotes`+`quote_items` (solo si quieres mantener el flow público de aprobación).

**Eliminar:**
- Todas las páginas del app: `Home`, `Hub`, `Bitacora`, `BitacoraDemo`, `Tasks`, `Clients`, `ClientProfile`, `Finances`, `Quotes` (panel interno), `Vault`, `Settings`, `Comando`, `SuperAdmin`, `AdminDashboard`, `Onboarding`, `Setup`, `JoinWorkspace`, `Login`, `Signup`, `ForgotPassword`, `ResetPassword`, `Mas`, `Pricing`, `PlaygroundActivityEngine`.
- Componentes del app: `AppLayout`, `AppSidebar`, `BottomNav`, `BitacoraLayout`, `ProfileSheet`, `TimerFAB`, `SidebarTimerSlot`, `NotificationBell`, `PlanRouter`, `Protected/Admin/SuperAdminRoute`, `OnboardingWizard/Tour/Checklist`, `WelcomeModal`, `HelpFAB/Drawer`, `FeedbackModal`, `AIAssistantDrawer`, `AiFieldHelper`, `InviteMemberModal`, todos los modales/paneles de tareas/facturas/pagos/clientes, todo `components/bitacora/*`, `components/dashboard/*`, `components/home/*`, `components/hub/*`, `components/profile/*`, `components/quotes/*` (excepto lo necesario para QuoteApproval), `components/settings/*`, `components/tasks/*`, `components/timer/*`.
- Módulos: todo `src/modules/bitacora/*`.
- Hooks: `useAutosave`, `useAttentionSignals`, `useAutoSuggestClient`, `useHourlyRate`, `usePlan`, `useRole`, `useSpeechRecognition`, `useSubscription`, `useTimeEntries`, `useUnreadChats`.
- Contextos: `AuthContext`, `TimerContext` (mantener `LanguageContext` si lo usas).
- Lib: `activityLog`, `clientCompleteness`, `extractClient`, `stripe-plans`, `timer-utils`.
- Edge functions del app: todas las de IA, Stripe, invoices, scan-receipt, invite-member, slack-*, oasis-ai-chat, summarize-chat, delete-account, list/revoke-user-session, ai-field-helper, rewrite-description, extract-client, generate-quote-pdf (a menos que mantengas QuoteApproval).
- Supabase: todas las tablas operativas (profiles, agencies, clients, projects, tasks, time_entries, invoices, payments, etc.) — pero **NO ejecutes drop**: simplemente el frontend deja de tocarlas. Si quieres limpieza real de DB, hacemos otro proyecto Supabase vacío para el corporativo.
- Rutas en `App.tsx`: dejar solo las corporativas.

**Ajustes:**
- `App.tsx`: router solo con páginas corporativas, sin `AuthProvider`, sin `TimerProvider`, sin `PlanRouter`.
- CTAs "Probar gratis" / "Login" / "Empezar gratis" → `https://app.estudiooasis.com/signup` y `/login`.
- `vite.config.ts`, `package.json`: quitar deps no usadas (Stripe, html2pdf, recharts si no se usa, etc.). `knip` se encarga.
- Sitemap regenerado solo con rutas corporativas.

## Paso 3 — Limpieza del proyecto ORIGINAL (app OasisOS)

**Eliminar:**
- Páginas corporativas: `Landing`, `AboutRoger`, `AboutStudio`, `Servicios`, `Portfolio`, `Contacto`, `AvisoPrivacidad`.
- Componentes: `SiteNavbar`, `SiteFooter`, `RogerContactFab`.
- Rutas correspondientes en `App.tsx`.

**Conservar:**
- `OasisOS.tsx` como landing pública (cara comercial dentro de la app, accesible sin login en `/` o `/oasis-os`).
- `Login`, `Signup`, `Pricing`, `QuoteApproval`, `Unsubscribe`, `BitacoraDemo` (públicos).
- Todo el resto de la app sin cambios.

**Ajustes:**
- Ruta `/` → ahora muestra `OasisOS.tsx` (landing del producto) para visitantes no autenticados; usuarios autenticados van a `/home` como hoy.
- Sitemap regenerado solo con rutas del app + landing OasisOS.

## Paso 4 — Dominios

1. En el **remix** (corporativo): Settings → Domains → conectar `estudiooasis.com` y `www.estudiooasis.com`. **Antes** lo desconectas del proyecto original.
2. En el **proyecto original** (app): Settings → Domains → conectar `app.estudiooasis.com` (subdominio nuevo, registro A → 185.158.133.1).
3. Actualizar memoria del proyecto: dominio canónico del app pasa a `https://app.estudiooasis.com` (afecta redirects de auth, invitaciones, emails).
4. En Supabase (Cloud → Users → Auth settings): Site URL y URI allow list → `https://app.estudiooasis.com`.

## Paso 5 — Verificación

- Corporativo: navegar Landing → Servicios → Portfolio → About → OasisOS → CTA debe ir a `app.estudiooasis.com/signup`.
- App: login en `app.estudiooasis.com`, OAuth Google funciona con nuevo redirect, emails transaccionales usan nuevo dominio.
- 404s, sitemap, robots.txt revisados en ambos.

## Detalles técnicos

```text
PROYECTO ORIGINAL (queda como app)
  domain: app.estudiooasis.com
  Supabase: el actual (intacto)
  Stack: idéntico

REMIX (nuevo corporativo)
  domain: estudiooasis.com + www
  Supabase: el mismo (compartido) o uno nuevo vacío — decidir
  Stack: React + Vite sin AuthProvider/TimerProvider, solo páginas estáticas + forms
```

**Nota sobre Supabase:** El remix hereda la misma conexión Supabase. Tienes dos opciones:
- (a) **Compartirla**: el form de Contacto y QuoteApproval siguen escribiendo a la misma DB. Más simple.
- (b) **Crear Supabase nuevo y vacío** para el corporativo: aislamiento total, pero hay que re-crear `analytics_events`, `email_*`, etc.

Recomiendo (a) por simplicidad.

## Qué necesito de ti para empezar

1. Crea el remix manualmente y confirma el nombre.
2. Confirma: ¿Supabase compartido (a) o nuevo (b) para el corporativo?
3. Cuando estés en el remix, dime "limpia para corporativo" y ejecuto el Paso 2. Luego vuelves aquí y digo "limpia para app" para el Paso 3.
