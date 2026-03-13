import { cn } from "@/lib/utils";

interface MemberBubbleProps {
  name: string;
  avatarUrl: string | null;
  status: "working" | "break" | "offline" | "online";
  statusLabel: string;
  currentClient: string | null;
  currentTask: string | null;
  isMe?: boolean;
  onClick: () => void;
}

const statusColors = {
  working: "border-success ring-success/20",
  online: "border-primary ring-primary/20",
  break: "border-accent ring-accent/20",
  offline: "border-border ring-transparent",
};

const statusDot = {
  working: "bg-success",
  online: "bg-primary",
  break: "bg-accent",
  offline: "bg-foreground-muted",
};

export function MemberBubble({ name, avatarUrl, status, statusLabel, currentClient, currentTask, isMe, onClick }: MemberBubbleProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 w-20 group",
        isMe ? "cursor-default" : "cursor-pointer"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all",
            statusColors[status],
            status === "working" && "ring-2 animate-pulse",
            status === "online" && "ring-2",
            !isMe && "group-hover:scale-105"
          )}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-foreground-secondary">{initials}</span>
          )}
        </div>
        {/* Status dot */}
        <div
          className={cn(
            "absolute -bottom-0.5 right-0 h-3.5 w-3.5 rounded-full border-2 border-background",
            statusDot[status]
          )}
        />
      </div>

      {/* Name */}
      <span className="text-xs font-medium text-foreground truncate w-full text-center">
        {isMe ? "Tú" : name.split(" ")[0]}
      </span>

      {/* Status / client / task */}
      <div className="flex flex-col items-center gap-0.5 min-h-[28px]">
        {status === "working" && currentClient ? (
          <>
            <span className="text-[10px] text-foreground-muted truncate max-w-[80px]">{currentClient}</span>
            {currentTask && (
              <span className="text-[10px] text-foreground-muted truncate max-w-[80px] italic">"{currentTask}"</span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-foreground-muted">{statusLabel}</span>
        )}
      </div>
    </button>
  );
}