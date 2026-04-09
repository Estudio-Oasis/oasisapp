import { WidgetCard } from "@/components/ui/widget-card";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Users2, FileText, Shield, DollarSign, FolderKanban,
} from "lucide-react";

const SHORTCUTS = [
  { icon: Calendar, label: "Calendario", path: "/tasks", color: "text-accent" },
  { icon: Users2, label: "Clientes", path: "/clients", color: "text-foreground-secondary" },
  { icon: FileText, label: "Cotizaciones", path: "/quotes", color: "text-foreground-secondary" },
  { icon: Shield, label: "Vault", path: "/vault", color: "text-foreground-secondary" },
  { icon: FolderKanban, label: "Tareas", path: "/tasks", color: "text-foreground-secondary" },
  { icon: DollarSign, label: "Finanzas", path: "/finances", color: "text-foreground-secondary" },
];

export function ShortcutsWidget() {
  const navigate = useNavigate();

  return (
    <WidgetCard title="Accesos directos">
      <div className="grid grid-cols-3 gap-2">
        {SHORTCUTS.map(s => (
          <button
            key={s.label}
            onClick={() => navigate(s.path)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/30 hover:border-accent/20 hover:bg-accent/5 transition-all group"
          >
            <s.icon className={`h-5 w-5 ${s.color} group-hover:text-accent transition-colors`} />
            <span className="text-[10px] font-medium text-foreground-secondary group-hover:text-foreground transition-colors">{s.label}</span>
          </button>
        ))}
      </div>
    </WidgetCard>
  );
}
