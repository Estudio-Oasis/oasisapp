

## Integración con Slack — Envío de notificaciones

### Alcance
Usar el conector de Slack de Lovable para enviar mensajes desde la app a un canal de Slack. No se pueden recibir mensajes de Slack (limitación del conector).

### Casos de uso
1. **Notificación de mensajes de chat**: Cuando alguien envía un mensaje en el Hub, se notifica en un canal de Slack
2. **Cambios de estado**: "Rosa cambió su estado a Break" → se publica en Slack
3. **Resúmenes de IA**: Enviar el resumen generado a Slack automáticamente

### Implementación

**1. Conectar Slack**
- Usar el conector `slack` de Lovable para vincular un workspace de Slack al proyecto

**2. Edge Function `slack-notify`**
- Recibe tipo de evento + datos
- Envía mensaje formateado al canal configurado vía connector gateway
- URL: `https://connector-gateway.lovable.dev/slack/api/chat.postMessage`

**3. Integrar en flujos existentes**
- En `ChatPanel.tsx`: después de enviar mensaje, invocar edge function para notificar en Slack
- En `TimerContext.tsx`: al cambiar estado, notificar en Slack
- En `summarize-chat`: al generar resumen, enviarlo a Slack

### Archivos
| Archivo | Acción |
|---|---|
| `supabase/functions/slack-notify/index.ts` | Nueva edge function |
| `src/components/hub/ChatPanel.tsx` | Llamar a slack-notify al enviar mensaje |
| `src/contexts/TimerContext.tsx` | Llamar a slack-notify al cambiar estado |

### Prerequisito
Conectar el conector de Slack al proyecto antes de implementar.

