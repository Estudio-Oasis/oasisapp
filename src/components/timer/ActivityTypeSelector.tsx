import { PAUSE_TYPES, type ActivityType } from "./ActivityConstants";

interface ActivityTypeSelectorProps {
  onSelect: (type: ActivityType) => void;
  onCancel: () => void;
}

export function ActivityTypeSelector({ onSelect, onCancel }: ActivityTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-micro text-foreground-secondary">Tipo de pausa</p>
      <div className="grid grid-cols-2 gap-2">
        {PAUSE_TYPES.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => onSelect(t.key)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground hover:bg-background-secondary transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" style={{ color: t.color }} />
              {t.label}
            </button>
          );
        })}
      </div>
      <button
        onClick={onCancel}
        className="w-full text-center text-small text-foreground-secondary hover:text-foreground transition-colors py-1"
      >
        Cancelar
      </button>
    </div>
  );
}
