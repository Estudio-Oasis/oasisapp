import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { PALETTE, TOOL_LANES, type Tool, type ToolLane } from "./heroContent";

type ActiveTool = { tool: Tool; color: string; key: string };

function ToolChip({
  tool,
  color,
  isActive,
  onToggle,
  onClose,
}: {
  tool: Tool;
  color: string;
  isActive: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  return (
    <span className="relative shrink-0">
      <button
        type="button"
        onClick={onToggle}
        style={{
          borderColor: color,
          color: isActive ? "#FCFCFA" : color,
          backgroundColor: isActive ? color : "transparent",
          ["--tc" as string]: color,
        }}
        className="border-2 px-4 md:px-5 py-2 md:py-3 font-condensed text-[clamp(17px,2vw,30px)] leading-none whitespace-nowrap transition-colors duration-200 hover:!bg-[var(--tc)] hover:!text-[#FCFCFA]"
      >
        {tool.name}
      </button>

      {isActive ? (
        <span
          role="dialog"
          className="absolute left-1/2 -translate-x-1/2 top-[calc(100%+10px)] z-30 block w-[min(78vw,340px)] bg-[#FCFCFA] border-2 p-4 text-left animate-rise-in shadow-[6px_6px_0_0_rgba(17,17,16,0.12)]"
          style={{ borderColor: color }}
        >
          <span className="flex items-start justify-between gap-3">
            <span
              className="font-mono-label text-[10px] tracking-[0.24em] uppercase"
              style={{ color }}
            >
              {tool.name}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="shrink-0 -mt-1 h-6 w-6 flex items-center justify-center border border-[#111110]/20 hover:border-[#111110] transition-colors"
            >
              <X className="h-3 w-3 text-[#111110]" />
            </button>
          </span>
          <span className="mt-2 block font-body text-[13px] md:text-[14px] leading-relaxed text-[#111110]/70 normal-case tracking-normal">
            {tool.desc}
          </span>
        </span>
      ) : null}
    </span>
  );
}

function Lane({
  lane,
  laneIndex,
  offset,
  active,
  setActive,
}: {
  lane: ToolLane;
  laneIndex: number;
  offset: number;
  active: ActiveTool | null;
  setActive: (v: ActiveTool | null) => void;
}) {
  const items = [...lane.items, ...lane.items];
  const paused = active?.key.startsWith(`${laneIndex}-`);

  return (
    <div className="mt-6 md:mt-8">
      <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-[#111110]/40 px-4 md:px-6">
        {lane.title}
      </p>
      <div className="mt-3 overflow-x-clip group">
        <div
          className={`flex w-max gap-2 md:gap-3 pb-[150px] -mb-[150px] ${
            lane.direction === "left" ? "animate-marquee" : "animate-marquee-reverse"
          } group-hover:[animation-play-state:paused]`}
          style={{
            animationDuration: `${28 + (lane.items.length % 5) * 4}s`,
            animationPlayState: paused ? "paused" : undefined,
          }}
        >
          {items.map((item, i) => {
            const color = PALETTE[(i + offset) % PALETTE.length];
            const key = `${laneIndex}-${item.name}-${i}`;
            return (
              <ToolChip
                key={key}
                tool={item}
                color={color}
                isActive={active?.key === key}
                onToggle={() => setActive(active?.key === key ? null : { tool: item, color, key })}
                onClose={() => setActive(null)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ToolsMarqueeSection() {
  const [active, setActive] = useState<ActiveTool | null>(null);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <section
      className="bg-[#FCFCFA] border-t-2 border-[#111110] pt-10 md:pt-16 pb-20 md:pb-28 overflow-x-clip"
    >
      <div className="max-w-[1700px] mx-auto">
        <h2 className="px-4 md:px-6 font-ultra text-[clamp(44px,10vw,180px)] leading-[0.86] text-[#111110]">
          Todo lo que usamos
        </h2>
        <p className="px-4 md:px-6 mt-3 font-mono-label text-[10px] md:text-[11px] tracking-[0.24em] uppercase text-[#111110]/40">
          Toca cualquiera para ver para qué la usamos
        </p>

        <div className="mt-8 md:mt-12">
          {TOOL_LANES.map((lane, i) => (
            <Lane
              key={lane.title}
              lane={lane}
              laneIndex={i}
              offset={i * 3}
              active={active}
              setActive={setActive}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
