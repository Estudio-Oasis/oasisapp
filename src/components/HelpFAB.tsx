import { useState } from "react";
import { useLocation } from "react-router-dom";
import { HelpCircle, MessageSquareText, BookOpen, Bot, X } from "lucide-react";
import { FeedbackModal } from "@/components/FeedbackModal";
import { HelpDrawer } from "@/components/HelpDrawer";
import { AIAssistantDrawer } from "@/components/AIAssistantDrawer";

const MODULE_MAP: Record<string, string> = {
  "/home": "Inicio",
  "/bitacora": "Bitácora",
  "/hub": "Hub",
  "/clients": "Clientes",
  "/tasks": "Tareas",
  "/quotes": "Cotizaciones",
  "/vault": "Vault",
  "/finances": "Finanzas",
  "/admin": "Admin",
  "/settings": "Ajustes",
};

export function HelpFAB() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const moduleName = MODULE_MAP[location.pathname] || MODULE_MAP[`/${location.pathname.split("/")[1]}`] || "OasisOS";

  const options = [
    { icon: MessageSquareText, label: "Dar feedback", onClick: () => { setFeedbackOpen(true); setOpen(false); } },
    { icon: BookOpen, label: "Guía de este módulo", onClick: () => { setHelpOpen(true); setOpen(false); } },
    { icon: Bot, label: "Preguntarle a OasisAI", onClick: () => { setAiOpen(true); setOpen(false); } },
  ];

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={opt.onClick}
                className="flex items-center gap-3 bg-card shadow-md rounded-xl px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors border border-border/50"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <opt.icon className="h-4 w-4 text-foreground-secondary" />
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="h-12 w-12 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95"
        >
          {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        </button>
      </div>

      <FeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} moduleName={moduleName} />
      <HelpDrawer open={helpOpen} onOpenChange={setHelpOpen} moduleName={moduleName} />
      <AIAssistantDrawer open={aiOpen} onOpenChange={setAiOpen} />
    </>
  );
}
