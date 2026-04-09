import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BookOpen } from "lucide-react";

const GUIDES: Record<string, string> = {
  "Bitácora": `**Bitácora es tu diario de tiempo.** Aquí registras qué estás haciendo y para qué cliente.

▶ **Cómo iniciar un registro:** click en "¿En qué estás trabajando?" o ⌘K
⏸ **Cómo pausar:** botón "Registrar pausa"
✓ **Cómo cerrar el día:** botón "Detener registro"

💡 **Tip:** Los registros sin cliente no se pueden cobrar — asigna siempre un cliente.`,

  "Hub": `**Hub es el pulso de tu equipo.** Aquí ves quién está trabajando y en qué.

🟢 Verde = trabajando activamente
🟡 Amarillo = en pausa (break, comida, reunión)
⚫ Gris = offline

💬 **Chats:** mensajes directos con tu equipo para coordinar sin salir del sistema.`,

  "Tareas": `**Tareas organiza el trabajo del equipo** en un tablero Kanban.

← **Backlog:** tareas sin fecha o sin asignar
→ **Listo:** tareas terminadas
🔴 **Vencidas:** tareas con fecha pasada — atención inmediata

💡 **Tip:** Vincula cada tarea a un cliente para ver la rentabilidad.`,

  "Cotizaciones": `**Cotizaciones te permite crear propuestas** y enviarlas directamente al cliente.

1. Crea la cotización con los servicios e importes
2. Genera el link de aprobación
3. El cliente aprueba o rechaza desde su email — sin login requerido

💡 **Tip:** Las cotizaciones aprobadas se pueden convertir en facturas.`,

  "Clientes": `**Clientes centraliza la información** de quienes te pagan.

📋 Cada cliente tiene su perfil con datos de contacto, facturación y notas
📊 Puedes ver las horas registradas por cliente este mes
🔗 Los clientes se conectan con proyectos, tareas y cotizaciones

💡 **Tip:** Completa el perfil del cliente al 100% para agilizar la facturación.`,

  "Vault": `**Vault es tu bóveda de credenciales.** Guarda accesos de clientes de forma segura.

🔐 Guarda URLs, usuarios y contraseñas por cliente
📂 Organiza por categorías (hosting, redes sociales, email, etc.)
🔍 Busca rápidamente por nombre del servicio

💡 **Tip:** Usa categorías para encontrar credenciales más rápido.`,

  "Finanzas": `**Finanzas te da visibilidad sobre el dinero.**

📊 **Ingresos vs Gastos:** gráfica mensual de los últimos 6 meses
💰 **Pagos:** registro de todos los pagos recibidos
🧾 **Facturas:** control de facturas emitidas y su estado
📁 **Gastos:** registro de gastos operativos

💡 **Tip:** Sube los comprobantes de pago para tener un respaldo digital.`,

  "Inicio": `**Inicio es tu dashboard principal.** Un resumen de todo lo que está pasando hoy.

📋 **Mi día:** tareas programadas para hoy
⏱ **Bitácora:** inicia, cambia o detén tu registro de tiempo
👥 **Equipo:** quién está activo y en qué trabaja
📊 **KPIs (admin):** ingresos, horas del equipo, cotizaciones pendientes`,

  "Admin": `**Admin es el panel de administración** del sistema.

👥 Gestiona usuarios y roles
📊 Ve métricas generales del equipo
⚙️ Configura ajustes globales de la agencia`,

  "Ajustes": `**Ajustes te permite personalizar** tu perfil y la configuración de la agencia.

👤 **Perfil:** nombre, email, avatar, horario laboral
🏢 **Agencia:** nombre legal, RFC, datos bancarios
👥 **Miembros:** invita y gestiona roles del equipo
💳 **Suscripción:** gestiona tu plan`,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleName: string;
}

export function HelpDrawer({ open, onOpenChange, moduleName }: Props) {
  const content = GUIDES[moduleName] || `Guía de ${moduleName} próximamente.`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] sm:max-w-[380px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Guía: {moduleName}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
          {content.split("\n\n").map((paragraph, i) => (
            <p key={i} className="text-sm text-foreground-secondary leading-relaxed mb-3 whitespace-pre-line">
              {paragraph.split("**").map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
              )}
            </p>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
