# Anti‑Humo OS — Próximamente + lista de espera

## Idea
Después del manifiesto, el visitante entiende el problema pero no tiene dónde implementarlo. Añadimos la pieza que falta: **Anti‑Humo OS**, el sistema de crecimiento que el empresario posee. Como aún no está montado, se presenta como *Próximamente* con una lista de espera real, sin prometer acceso inmediato ni precios definitivos.

Regla editorial que se respeta en todo el texto: nunca vender una herramienta como si fuera una estrategia. El OS se presenta como infraestructura para ejecutar el criterio, no como la estrategia misma.

## Qué se construye

### 1. Nuevo capítulo en la landing del Colectivo
Entre "El movimiento" y el cierre, un capítulo propio (06) con:
- Titular: **"Deja de rentar tu marketing."** y subtítulo: construye una máquina que siga funcionando aunque mañana cambies de agencia.
- Los tres caminos después del diagnóstico, en lenguaje claro:
  1. Te falta criterio → playbook y comunidad (gratis, ya disponible).
  2. Te falta infraestructura → Anti‑Humo OS (próximamente).
  3. Te falta estrategia o ejecución → Estudio Oasis (disponible).
- Lo que el sistema resolverá, en una lista corta y concreta: capturar demanda, responder al instante, dar seguimiento, agendar, pedir reseñas, reactivar clientes, medir qué funciona.
- Frase monumental: **"PAUTA COMO ACELERADOR. NO COMO RESPIRADOR ARTIFICIAL."**
- Bloque breve "Cuándo sí conviene pagar publicidad" con el cálculo del faltante de leads (meta de clientes, tasa de cierre, leads necesarios, leads orgánicos, brecha, costo por lead objetivo) explicado en palabras normales.
- Aviso honesto: todavía no está abierto, no hay precio final, se avisará primero a la lista.

### 2. Lista de espera
- Formulario propio: nombre, correo, WhatsApp opcional, tipo de negocio y consentimiento explícito con enlace al aviso de privacidad.
- Se guarda en la misma base de leads con una fuente distinta para poder filtrar interesados en el sistema aparte de los del manifiesto.
- Estados claros: enviando, error, éxito. Tras registrarse, el bloque cambia a confirmación ("estás en la lista") y lo recuerda en ese navegador.
- Si la persona ya desbloqueó el manifiesto, el formulario llega prellenado para no volver a pedir lo mismo.

### 3. Recursos
Añadir una segunda tarjeta en `/recursos` para Anti‑Humo OS con etiqueta *Próximamente*, que lleva directo al capítulo de la lista de espera.

## Diseño y movimiento
Mismo lenguaje del sitio: fondo casi blanco/negro, tipografía condensed gigante, acento rojo, grano sutil, numeración editorial. El diagrama de caminos se dibuja con líneas y texto, sin tarjetas anidadas ni iconografía decorativa. Revelados suaves al entrar, respeto a reducción de movimiento, móvil en una columna con titulares acotados y sin desbordes horizontales.

## Bilingüe
Todo el capítulo, formulario, validaciones y estados en español e inglés, usando el sistema de idioma actual y contenido como datos bilingües.

## Detalles técnicos
- Nuevo componente `src/components/resources/AntiHumoOS.tsx` (capítulo + caminos + calculadora de brecha de leads) y `src/components/resources/WaitlistForm.tsx`.
- Contenido bilingüe en `src/components/resources/colectivoContent.ts`.
- `src/lib/leads.ts`: añadir `"anti-humo-os"` al enum de `source`; sin cambios de esquema en base de datos.
- Persistencia local con una clave propia (`anti-humo-os-waitlist`), independiente del desbloqueo del manifiesto.
- Añadir la entrada `06 Sistema` a la navegación de capítulos de la landing y la tarjeta en `src/pages/Recursos.tsx`.
- El capítulo queda dentro del contenido desbloqueado, después del registro del Colectivo.

## Verificación
- Recorrido completo en español e inglés, claro y oscuro.
- Registro válido e inválido, error de red, confirmación y persistencia tras recargar.
- Cálculo de la brecha de leads con casos conocidos.
- Móvil y escritorio sin desbordes, navegación por teclado, contraste y reducción de movimiento.
- Confirmar que el registro del Colectivo y los formularios existentes siguen funcionando.
