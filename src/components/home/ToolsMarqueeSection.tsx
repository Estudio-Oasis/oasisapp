import { PALETTE, TOOL_LANES, type ToolLane } from "./heroContent";

function Lane({ lane, offset }: { lane: ToolLane; offset: number }) {
  const items = [...lane.items, ...lane.items];
  return (
    <div className="mt-6 md:mt-8">
      <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.28em] uppercase text-[#111110]/40 px-4 md:px-6">
        {lane.title}
      </p>
      <div className="mt-3 overflow-hidden group">
        <div
          className={`flex w-max gap-2 md:gap-3 ${
            lane.direction === "left" ? "animate-marquee" : "animate-marquee-reverse"
          } group-hover:[animation-play-state:paused]`}
          style={{ animationDuration: `${28 + (lane.items.length % 5) * 4}s` }}
        >
          {items.map((item, i) => {
            const color = PALETTE[(i + offset) % PALETTE.length];
            return (
              <span
                key={`${item}-${i}`}
                className="shrink-0 border-2 px-4 md:px-5 py-2 md:py-3 font-condensed text-[clamp(17px,2vw,30px)] leading-none whitespace-nowrap transition-colors duration-300 hover:text-[#FCFCFA]"
                style={{
                  borderColor: color,
                  color,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {item}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ToolsMarqueeSection() {
  return (
    <section className="bg-[#FCFCFA] border-t-2 border-[#111110] pt-10 md:pt-16 pb-20 md:pb-28 overflow-hidden">
      <div className="max-w-[1700px] mx-auto">
        <h2 className="px-4 md:px-6 font-ultra text-[clamp(44px,10vw,180px)] leading-[0.86] text-[#111110]">
          Todo lo que usamos
        </h2>

        <div className="mt-8 md:mt-12">
          {TOOL_LANES.map((lane, i) => (
            <Lane key={lane.title} lane={lane} offset={i * 3} />
          ))}
        </div>
      </div>
    </section>
  );
}
