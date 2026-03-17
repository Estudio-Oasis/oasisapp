# Fase 1: Landing Page — Reescritura completa

Tengo el archivo actual completo (700 líneas, 11 secciones orientadas a "Estudio Oasis como agencia"). Lo reescribo con la estructura acordada:

## Estructura nueva (reemplaza todo el archivo):

1. **Navbar** — Wordmark "Bitácora · by Estudio Oasis", links: Funciones / Para quién / Cómo funciona, CTA: "Probar gratis" → `/bitacora-demo`, link: "Iniciar sesión" → `/login`
2. **Hero** — Headline: "Le ponemos proceso y orden a la creatividad." Subheadline honesto: "Registra tu trabajo, entiende cómo se va tu día y empieza a poner orden a tu operación. Bitácora es la puerta de entrada a un sistema diseñado para individuos, equipos y líderes." CTA primario accent: "Probar Bitácora gratis" → `/bitacora-demo`. CTA secundario outline: "Ver cómo funciona" → scroll. Mockup actualizado con título "Bitácora" y datos de actividad individual.
3. **Problema** — Reutilizar los 5 pain points con copy directo, mismo layout de cards con "!"
4. **Para quién es** (NUEVA) — Grid 6 perfiles: Freelancers, Equipos creativos, Líderes y admins, Agencias y despachos, Consultores, Founders
5. **Las 3 funciones** — Bitácora como card GRANDE (borde accent, badge "Disponible hoy", CTA activo, ~70% peso visual). Centro de Control y Finanzas como cards más pequeñas, badge "Próximamente", sin CTA, borde estándar. Layout: Bitácora ocupa full-width o col-span-2 en desktop; las otras dos en una fila debajo.
6. **Para administradores** (bg oscuro #1A1A1A) — 6 beneficios-resultado en grid
7. **Para individuos** — "No necesitas un equipo para empezar."
8. **Cómo funciona** — 4 pasos centrados en Bitácora como puerta de entrada
9. **Vista del sistema** — Bitácora mockup grande detallado. Centro de Control y Finanzas como previews esquemáticos pequeños debajo.
10. **CTA final** — "Empieza a registrar tu día" → `/bitacora-demo` + "Crear cuenta gratis" → `/signup`
11. **Footer** — "Bitácora · by Estudio Oasis"

## Conservo del archivo actual:

- `useReveal()` hook y `RevealSection` component (funciona bien)
- Paleta de colores (#FAFAF8, #1A1A1A, #B8956A, #6B6B6B, #E8E8E4)
- Estilo general de cards y tipografía
- Mobile menu pattern del Navbar

## Elimino:

- `WhatWeDo` (se integra en hero)
- `ProductEcosystem` (reemplazado por 3 funciones con jerarquía)
- `FeaturedProduct` ("2026 Performance Manager" desaparece)
- `WhyDifferent` (redundante)
- `Showcase` (reemplazado por Vista del sistema)
- `UseCases` (integrado en "Para quién es")

## Archivo único a modificar:

`src/pages/Landing.tsx` — reescritura completa (~650 líneas)

## Mobile-first:

- Hero: stack vertical, headline clamp(28px, 5vw, 56px)
- Cards de funciones: stack vertical, Bitácora primero y más grande
- Grid de perfiles: 2 cols en mobile, 3 en desktop
- Grid de admins: 1 col mobile, 2-3 desktop
- Mockups: full width en mobile
- CTAs: full width en mobile  
  
Va bien. Yo ya le daría **luz verde para ejecutar Fase 1**, con 5 criterios finos para que no se desvíe:
  ```text
  Sí, ejecuta Fase 1.

  La estructura me gusta y puedes reescribir `src/pages/Landing.tsx` completo, pero cuida estos 5 puntos durante la implementación:

  1. El hero tiene que sentirse muy claro en los primeros 5 segundos. Quiero que arriba del fold se entienda:
     - qué es Bitácora
     - qué puedes probar hoy
     - que forma parte de un sistema más amplio
     No lo dejes solo bonito; tiene que ser inmediato.

  2. Bitácora debe dominar visualmente no solo en la sección de funciones, también en el hero y en la sección “Vista del sistema”. Tiene que sentirse como la puerta de entrada real, no como una card más grande nada más.

  3. Centro de Control y Finanzas deben verse como parte del sistema, pero con un tratamiento visual más sobrio y más esquemático. No quiero que compitan con Bitácora ni que parezcan tan listos como si ya fueran el foco principal.

  4. En la sección para administradores, prioriza beneficios concretos y legibles. Quiero frases muy directas, no demasiado copy. Que se entienda rápido el valor para un líder o dueño.

  5. Mobile-first de verdad:
     - hero limpio
     - CTAs muy claros
     - mockups legibles
     - cards bien espaciadas
     - nada demasiado apretado

  Cuando termines Fase 1, enséñame:
  - vista completa desktop
  - vista completa mobile
  - hero
  - sección de funciones
  - sección para administradores
  - vista del sistema
  - CTA final

  No avances a Fase 2 hasta revisar eso.

  ```
  Mi comentario adicional: el subheadline del hero está bien, pero si al verlo en diseño se siente largo, córtalo un poco. La prioridad es claridad y escaneabilidad.