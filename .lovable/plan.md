

# Vault de Contraseñas (estilo NordPass)

## Resumen

Crear una sección dedicada "/vault" como un gestor de contraseñas completo, separado de los clientes individuales. Reutiliza la tabla `client_credentials` existente pero con una vista centralizada tipo NordPass: lista de todas las credenciales, búsqueda, categorías, generador de contraseñas, y acceso rápido.

## Diseño de la experiencia

```text
┌─────────────────────────────────────────────┐
│  🔐 Vault                        + Añadir   │
│  ┌─────────────────────────────┐            │
│  │ 🔍 Buscar credenciales...   │            │
│  └─────────────────────────────┘            │
│  Filtros: [Todos] [Social] [Dev] [Email]... │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │ 🟢 Slack          Cliente: Voccalo    │  │
│  │    usuario: admin@voccalo.com         │  │
│  │    ••••••••  👁  📋                   │  │
│  ├───────────────────────────────────────┤  │
│  │ 🟣 GitHub         Cliente: OasisOS    │  │
│  │    usuario: oasis-dev                 │  │
│  │    ••••••••  👁  📋                   │  │
│  ├───────────────────────────────────────┤  │
│  │ 🔵 Hosting        Sin cliente         │  │
│  │    usuario: root                      │  │
│  │    ••••••••  👁  📋                   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Cambios planificados

### 1. Migración de base de datos
- Hacer `client_id` nullable en `client_credentials` (para credenciales sin cliente asociado)
- Añadir columna `agency_id` (uuid) para vincular credenciales directamente a la agencia
- Añadir columna `category` (text, default 'other') para clasificar (Social, Dev, Email, Hosting, CMS, etc.)
- Añadir columna `favicon_url` (text, nullable) para ícono del servicio
- Actualizar RLS policies para permitir acceso por `agency_id` además de por `client_id`

### 2. Nueva página `/vault` (src/pages/Vault.tsx)
- Barra de búsqueda que filtra por servicio, usuario, URL, cliente y notas
- Chips de categorías para filtrar (Todos, Social, Dev, Email, Hosting, CMS, Otro)
- Lista de credenciales con: ícono/inicial del servicio, nombre del servicio, cliente asociado (chip con color), usuario, contraseña oculta con botones ver/copiar
- Click en una credencial expande inline mostrando URL, notas, fecha de creación y botones editar/eliminar
- Botón "+ Añadir" abre un formulario modal/inline con: servicio, categoría, URL, usuario, contraseña, notas, y selector de cliente (opcional)
- Generador de contraseñas integrado: botón "Generar" junto al campo de contraseña que crea una contraseña segura (longitud configurable, con/sin símbolos)

### 3. Integración en navegación
- Añadir entrada "Vault" con ícono `Key` (o `Shield`) en el sidebar (`AppSidebar.tsx`) y bottom nav
- Ruta protegida Pro en `App.tsx`

### 4. Traducciones
- Añadir todas las cadenas en español e inglés al sistema i18n existente

### 5. Sincronización con perfil de cliente
- La tab "Credenciales" en ClientProfile sigue funcionando igual, pero ahora filtra del mismo vault por `client_id`
- Crear una credencial desde el perfil del cliente pre-selecciona ese cliente

## Detalles técnicos

**Migración SQL:**
```sql
ALTER TABLE client_credentials 
  ALTER COLUMN client_id DROP NOT NULL,
  ADD COLUMN agency_id uuid,
  ADD COLUMN category text NOT NULL DEFAULT 'other';

-- Backfill agency_id from client
UPDATE client_credentials cc
SET agency_id = c.agency_id
FROM clients c WHERE cc.client_id = c.id;

-- New RLS: view by agency
CREATE POLICY "Users can view own agency vault"
ON client_credentials FOR SELECT TO authenticated
USING (agency_id = user_agency_id());
-- Similar for INSERT, UPDATE, DELETE
```

**Generador de contraseñas:** Función local pura (no necesita API), configurable con slider de longitud (8-32) y toggles para mayúsculas, números, símbolos.

**Componente principal:** `src/pages/Vault.tsx` con sub-componentes inline (VaultCard, VaultForm, PasswordGenerator).

