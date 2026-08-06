import { PALETTE } from "./heroContent";

const STEPS = [
  {
    n: "01",
    title: "Diagnóstico",
    body: "Entramos a tus números, tus canales y tu operación. En días, no en meses. Te decimos qué está roto y qué se puede cobrar antes.",
  },
  {
    n: "02",
    title: "Sistema",
    body: "Ordenamos oferta, precio, medición y seguimiento. Sin sistema, cualquier campaña es una apuesta.",
  },
  {
    n: "03",
    title: "Ejecución",
    body: "Marca, contenido, pauta, tienda, software, automatizaciones. Lo hace el equipo que lo diseñó, no un tercero.",
  },
  {
    n: "04",
    title: "Escala",
    body: "Lo que funciona se repite y se mide. Lo que no, se corta. Cada mes con números a la vista.",
  },
];

export function ProcessSection() {
  return (
    <section data-reveal className="bg-[#FCFCFA] pb-20 md:pb-24">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#111110]/40">
          Cómo trabajamos
        </p>

        <div className="mt-6 grid md:grid-cols-4 border-t-2 border-[#111110]">
          {STEPS.map((s, i) => (
            <div
              key={s.n}
              className="py-7 md:py-9 md:px-6 md:first:pl-0 border-b border-[#111110]/15 md:border-b-0 md:border-r md:border-r-[#111110]/15 md:last:border-r-0"
            >
              <span
                className="font-ultra text-[clamp(38px,9vw,90px)] md:text-[min(4.6vw,8vh)] leading-none"
                style={{ color: PALETTE[i % PALETTE.length] }}
              >
                {s.n}
              </span>
              <h3 className="mt-2 font-condensed text-[clamp(20px,4vw,34px)] md:text-[min(2vw,3.4vh)] leading-none text-[#111110]">
                {s.title}
              </h3>
              <p className="mt-3 text-[14px] md:text-[15px] leading-relaxed text-[#111110]/60">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
