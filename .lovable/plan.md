

# Estrategia de Diferenciación: Individual vs Agencia vs Equipo

## El insight clave

No necesitas 3 onboardings diferentes. Necesitas **UN onboarding que se adapte** según una sola pregunta temprana: "¿Cómo vas a usar esto?"

La selección de `profile_type` que ya capturas (Freelancer/Fundador/Empleado/Otro) es exactamente el pivot point, pero hoy no hace nada. Debería cambiar 3 cosas: el copy, los pasos que se muestran, y hacia dónde se dirige al usuario.

## Cómo se diferencia cada segmento

```text
┌─────────────────┬──────────────────┬──────────────────┬──────────────────┐
│                 │ Individual       │ Equipo/Startup   │ Agencia          │
│                 │ (Freelancer)     │ (Fundador)       │ (Empleado/Otro)  │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Signup copy     │ "Organiza tu     │ "Organiza a tu   │ "Opera tu        │
│                 │  trabajo"        │  equipo"         │  agencia"        │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Onboarding      │ 3 pasos:         │ 4 pasos:         │ 4 pasos:         │
│ steps           │ Perfil → Cliente │ Perfil → Nombre  │ Perfil → Nombre  │
│                 │ → Listo          │ espacio → Cliente │ agencia → Cliente│
│                 │                  │ → Listo          │ → Listo          │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Workspace name  │ Auto (tu nombre) │ Le pides nombre  │ Le pides nombre  │
│                 │                  │ del equipo       │ de la agencia    │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Income question │ "¿Cuánto quieres │ Omitida          │ Omitida          │
│                 │  ganar al mes?"  │                  │                  │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Plan tier       │ Free (Solo)      │ Starter/Estudio  │ Estudio/Agencia  │
├─────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ First landing   │ Bitácora         │ Home (dashboard) │ Home (dashboard) │
└─────────────────┴──────────────────┴──────────────────┴──────────────────┘
```

## Cambios concretos

### 1. AuthLayout — Adaptar el panel izquierdo

Hoy el panel izquierdo es genérico. Propuesta: mantenerlo genérico pero con un mensaje que cubra ambos ("Organiza tu trabajo. Cobra lo que vales." ya funciona para todos). No necesita cambiar.

### 2. Signup — Mover `profile_type` AL REGISTRO

Este es el cambio más importante. En lugar de preguntar en el onboarding, preguntar en el signup ANTES del formulario:

- 4 chips: "Soy freelancer" / "Tengo un equipo" / "Tengo una agencia" / "Otro"
- Esto cambia el subtítulo del formulario dinámicamente
- Se guarda como metadata del signup y se pasa al onboarding

### 3. OnboardingWizard — Ramas condicionales

Según el `profile_type` seleccionado en signup:

**Freelancer/Otro (individual)**:
- Step 1: Nombre + País/Moneda + Income target + Horas (como está)
- Step 2: Primer cliente (como está)
- Step 3: Listo → va a Bitácora
- Workspace se crea automáticamente con su nombre

**Fundador/Equipo**:
- Step 1: Nombre + "¿Cómo se llama tu equipo?" + País/Moneda
- Step 2: Primer cliente
- Step 3: Listo → va a Home
- Sin preguntas de income (eso es individual)

### 4. Landing page — Sección "Para quién es"

Agregar una sección breve antes del pricing con 3 columnas:
- Freelancers: "Trackea tu tiempo, calcula tu valor hora, cobra mejor"
- Equipos: "Visibilidad en tiempo real de quién trabaja en qué"
- Agencias: "Gestiona clientes, cotizaciones y finanzas en un lugar"

### 5. Pricing — Renombrar para claridad

El tier free ya no se llama "Solo" sino "Individual". Los paid se mantienen como "Starter", "Estudio", "Agencia".

## Archivos a editar

- `src/pages/Signup.tsx` — agregar selector de profile_type antes del form
- `src/components/OnboardingWizard.tsx` — ramas condicionales según profile_type
- `src/components/AuthLayout.tsx` — sin cambios grandes, el copy actual sirve
- `src/pages/Landing.tsx` — agregar sección "Para quién es"
- `src/pages/Pricing.tsx` — renombrar tier free
- `src/lib/stripe-plans.ts` — actualizar descripción del plan

## Sin cambios de DB

El campo `profile_type` ya existe en profiles. Solo se pasa como metadata en el signup y se lee en el onboarding.

## Principio rector

El producto es el mismo. La diferencia es cómo te lo presento según tu contexto. Un freelancer no necesita saber que existe el Hub. Un fundador no necesita que le pregunten cuánto quiere ganar al mes. Cada uno ve lo que le importa, pero todos llegan al mismo sistema.

