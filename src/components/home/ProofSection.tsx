import { PALETTE } from "./heroContent";

const METRICS = [
  { num: "+200", label: "Clientes atendidos" },
  { num: "10", label: "Años operando" },
  { num: "$42MDD", label: "Ventas generadas" },
  { num: "9x", label: "ROAS promedio" },
];

const CLIENTS = [
  "Liverpool", "Zoe Water", "BBVA", "Platzi", "Baileys", "Herbalife",
  "SEDENA", "Rocketfy", "Mundo Cuervo", "Indumet", "Miami Ad School",
  "Koena", "Poliuretanos", "Maalob",
];

export function ProofSection() {
  return (
    <section data-reveal className="bg-[#111110] py-20 md:py-24 overflow-hidden">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#FCFCFA]/40">
          Lo que ya pasó
        </p>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-6 border-t border-[#FCFCFA]/15 pt-8">
          {METRICS.map((m, i) => (
            <div key={m.label}>
              <p
                className="font-ultra leading-[0.85] text-[clamp(52px,11vw,120px)] md:text-[min(7vw,13vh)]"
                style={{ color: PALETTE[i % PALETTE.length] }}
              >
                {m.num}
              </p>
              <p className="mt-2 font-mono-label text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-[#FCFCFA]/45">
                {m.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-16 md:mt-20 font-ultra text-[clamp(26px,5vw,72px)] md:text-[min(4.4vw,7vh)] leading-[1.02] text-[#FCFCFA]/25">
          Han confiado en nosotros{" "}
          {CLIENTS.map((c, i) => (
            <span key={c}>
              <span className="text-[#FCFCFA]/70 transition-colors duration-300 hover:text-[#FCFCFA]">
                {c}
              </span>
              {i < CLIENTS.length - 1 ? ", " : " y muchos más."}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
