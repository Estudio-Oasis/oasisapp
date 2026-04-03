

# Rediseno Estudio Oasis — Plan de Implementacion

## Resumen

Transformar el sitio actual (enfocado en Bitacora) en el sitio corporativo de Estudio Oasis con storytelling, portafolio, paginas About, y nueva identidad visual "Desert Modernism". Se mantienen las secciones existentes de funciones, precios y "para quien" integradas en el nuevo diseno.

## Cambios principales

### 1. Estilos globales y tipografia
- Agregar Google Fonts: Playfair Display (serif titulos), DM Sans (body), JetBrains Mono (etiquetas/datos) en `index.html`
- Agregar CSS custom properties para la paleta Desert Modernism (sand, charcoal, gold, terracotta, cream) en `index.css`
- Smooth scrolling global

### 2. Nuevas rutas en App.tsx
- `/about` — Pagina Estudio Oasis
- `/about/roger-teran` — Pagina Roger Teran
- `/portfolio` — Portafolio categorizado

### 3. Landing.tsx — Rediseno completo
Reescribir `Landing.tsx` manteniendo la estructura modular de componentes internos:

- **Navbar**: Agregar dropdown "About" (Estudio Oasis / Roger Teran), link a Portfolio, transparente en home con transicion al scroll
- **Hero**: Full-screen con imagen de desierto CDN, overlay gradiente, tipografia Playfair Display, "Creatividad con sistema"
- **Marquee de agencias**: CSS animation infinite scroll con 6 logos CDN, grayscale con hover color
- **Seccion Origen**: Grid 2 columnas, storytelling con card flotante "15+"
- **Contadores animados**: 4 stats con IntersectionObserver count-up (15+, 6, 50+, 100+) sobre fondo charcoal
- **Logos de marcas**: Grid de 6 logos (49ers, Nivea, Baileys, etc.) grayscale hover
- **Seccion Oasis OS**: Fondo oscuro, 6 features con iconos, imagen producto CDN
- **Secciones existentes mantenidas**: "Para quien", Precios, "Como funciona" — actualizadas visualmente con la nueva paleta
- **Footer rediseñado**: 4 columnas con navegacion, contacto, links sociales

### 4. Nueva pagina: About Estudio Oasis (`src/pages/AboutStudio.tsx`)
- Hero con tabs (Estudio Oasis activo / Roger Teran link)
- Seccion historia (grid 2 col)
- Grid de logos de agencias
- 3 cards "Lo que hacemos"
- CTA a Roger Teran

### 5. Nueva pagina: About Roger Teran (`src/pages/AboutRoger.tsx`)
- Hero con tabs invertidos
- Bio con sidebar sticky (foto, datos, links)
- Grid de areas de expertise con chips
- Timeline vertical de carrera (9 entries)
- CTA a portafolio

### 6. Nueva pagina: Portafolio (`src/pages/Portfolio.tsx`)
- Hero oscuro
- Filtros sticky (Todos, Brand Identity, Advertising, Content Strategy, Product Design, Growth)
- Grid de 10 proyectos con imagenes, badges, descripciones
- CTA final con links a Behance, Instagram, LinkedIn

## Archivos a crear/modificar

```text
MODIFICAR:
  index.html          — agregar fonts
  src/index.css       — paleta Desert Modernism
  src/App.tsx          — 3 nuevas rutas publicas
  src/pages/Landing.tsx — reescritura completa

CREAR:
  src/pages/AboutStudio.tsx
  src/pages/AboutRoger.tsx
  src/pages/Portfolio.tsx
```

## Notas tecnicas

- Todas las imagenes usan URLs CDN proporcionadas (permanentes)
- Animaciones con IntersectionObserver nativo (ya existe `useReveal` en Landing.tsx, reutilizar)
- Marquee con CSS `@keyframes` y `animation: scroll 30s linear infinite`
- Contadores con `requestAnimationFrame` count-up
- Sin framer-motion para mantener bundle ligero
- Las nuevas paginas son publicas (sin auth)
- El dropdown de About usa CSS hover en desktop, click en mobile
- Todas las secciones responsive (mobile-first)
- No se toca ninguna funcionalidad de la app (Bitacora, Hub, etc.)

