## Objetivo

Convertir el panel "Mi perfil" en algo verdaderamente vivo: guardado y validación en tiempo real, ver y cerrar sesiones activas, y la pestaña Equipo solo para admins. Además, habilitar **Google Sign-In** para vincular `joserogelioteran@gmail.com` a tu cuenta `r@estudiooasis.com`, de modo que puedas entrar por cualquiera de los dos métodos sin duplicar la cuenta.

---

## 1. Identidades múltiples (login por varios mails)

Supabase no permite "agregar un segundo email/contraseña" a la misma cuenta, pero **sí permite vincular varias identidades OAuth** (Identity Linking) a un mismo usuario. El estándar de la industria para este caso es:

1. Activar **Google** como proveedor (Lovable Cloud Managed Social Login).
2. En *Mi perfil → Cuenta → Métodos de inicio de sesión*, mostrar identidades vinculadas (`auth.getUserIdentities()`).
3. Botón **"Vincular cuenta de Google"** → llama `supabase.auth.linkIdentity({ provider: 'google' })` mientras estás logueado con `r@estudiooasis.com`. Al completar el OAuth con `joserogelioteran@gmail.com`, esa identidad queda atada al mismo `user.id`. A partir de ese momento podrás entrar:
   - Email + contraseña con `r@estudiooasis.com`
   - Google con `joserogelioteran@gmail.com`
   - Ambos resuelven al mismo perfil, agencia y datos.
4. Botón "Desvincular" por cada identidad (solo si queda al menos una).

> Nota: si en el futuro quieres también iniciar con `joserogelioteran@gmail.com` por contraseña, lo correcto es seguir usando Google (esa es la razón por la que existe el linking). No vamos a duplicar usuarios en `auth.users`.

---

## 2. Guardado y validación en tiempo real

Reemplazar los botones "Guardar" actuales por **autoguardado con debounce (700 ms)** y feedback inline:

**Cuenta**
- `name`, `job_title`, `phone`, `bio`: validación en blur + autoguardado. Indicador de estado por campo: idle / "Guardando…" / "Guardado ✓" / error.
- `email`: editable en línea con confirmación modal (sigue usando `supabase.auth.updateUser({ email })`); muestra estado "Pendiente de verificación" si hay `new_email`.
- Validaciones: nombre 2-60 chars, teléfono regex E.164 opcional, bio ≤ 280 chars, email RFC.
- Contraseña: misma sección, no autosave (requiere botón explícito por seguridad), validación de fortaleza visible.

**Preferencias**
- `theme`, `language`, `timezone`, `week_start_day`, `work_hours`, `notification_preferences`: autoguardan al cambiar. El switch / select aplica el cambio y hace `update` inmediato con toast discreto solo en error.

**Equipo** (solo lectura/acciones, ya es realtime por naturaleza).

Estructura: hook `useAutosaveField(field, value, validator)` centralizado que envuelve el `update` a `profiles` y maneja debounce + estado.

---

## 3. Sesiones activas

Supabase no expone las sesiones del propio usuario desde el cliente, así que se hace vía edge function con service role:

- **Edge function `list-user-sessions`** (`verify_jwt` activo, valida JWT en código): llama `supabase.auth.admin.listUserSessions(userId)` y devuelve `id`, `created_at`, `updated_at`, `user_agent`, `ip`, `factor_id`, marcando cuál es la sesión actual (comparando con `session.access_token`'s `session_id` claim).
- **Edge function `revoke-user-session`**: recibe `session_id`, llama `supabase.auth.admin.signOut(session_id, 'local')` para revocar una sola.
- En *Mi perfil → Cuenta → Sesiones activas*: lista con dispositivo (parseado de UA), última actividad, ubicación aproximada y botones "Cerrar esta sesión" / "Cerrar sesión en todos los demás dispositivos" (ya existe el global; añadir el "demás" excluyendo la actual).

---

## 4. Pestaña Equipo (solo admin)

Ya está parcialmente. Consolidar para que use exactamente el mismo esquema que `MembersTab.tsx` (la versión completa de Settings) para evitar duplicación lógica:

- Renderizar `<MembersTab agencyId={...} isAdmin allowedDomain={...} />` directamente dentro del Tab "Equipo" del ProfileSheet, en lugar de mantener su propia mini-implementación.
- Si no eres admin, la pestaña no se muestra.
- Beneficio: una sola fuente de verdad para invitaciones, enlace universal, cooldowns, cambio de rol, eliminación, etc.

---

## Cambios técnicos

```text
Backend (Supabase)
├─ configure_social_auth: enable ['google']
├─ edge fn  supabase/functions/list-user-sessions/index.ts
└─ edge fn  supabase/functions/revoke-user-session/index.ts

Frontend
├─ src/hooks/useAutosave.ts                (debounce + estado por campo)
├─ src/components/profile/IdentitiesSection.tsx
│       (lista identidades, botón Vincular Google, Desvincular)
├─ src/components/profile/SessionsSection.tsx
│       (fetch sesiones, revocar individual, "cerrar otras")
├─ src/components/ProfileSheet.tsx
│       - quitar botones "Guardar" de Cuenta y Preferencias
│       - integrar autosave en cada input/switch/select
│       - insertar IdentitiesSection y SessionsSection en pestaña Cuenta
│       - reemplazar Tab Equipo por <MembersTab/>
└─ src/pages/Login.tsx
        - añadir botón "Continuar con Google"
```

Sin cambios de DB (los campos `phone`, `bio`, `timezone`, `notification_preferences`, `week_start_day` ya existen).

---

## Premortem

| Riesgo | Mitigación |
|---|---|
| Vincular Google con `joserogelioteran@gmail.com` falla porque ya existe otra cuenta con ese email | Si pasa, Supabase devuelve `identity_already_exists`. Mostramos guía clara: "Esa cuenta ya existe; entra una vez con ella y se vincula sola al haber session compartida" o pedir borrar la huérfana. |
| Autosave dispara escrituras excesivas | Debounce 700 ms + diff vs último valor guardado. |
| `linkIdentity` redirige fuera de la SPA | Usar `redirectTo: window.location.href` para volver al mismo lugar y refrescar identidades al volver. |
| `listUserSessions` no disponible en tu versión de `supabase-js` | El admin API la soporta server-side; la llamamos desde la edge fn, no desde el cliente. |
| Cambio de email rompe sesión | Supabase mantiene la sesión; solo se confirma el nuevo correo por link. Mostramos badge "Pendiente de confirmación". |
| Confusión "tengo dos emails, ¿cuál es el principal?" | UI marca claramente Email principal (el de `auth.users.email`) y "Identidades vinculadas" como métodos de acceso, no como direcciones de contacto. |

---

## Resultado esperado

- Editas tu perfil y todo se guarda sin tocar botones.
- Vas a *Cuenta → Métodos de inicio de sesión*, pulsas "Vincular Google", entras con `joserogelioteran@gmail.com`, y desde ese momento puedes loguear con cualquiera de los dos.
- Ves todas tus sesiones activas (dispositivo, IP, última actividad) y cierras la que quieras.
- Si eres admin, la pestaña Equipo es exactamente la misma de Ajustes — sin duplicar código.
