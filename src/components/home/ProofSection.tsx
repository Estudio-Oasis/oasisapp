import { BRANDS_MANAGED } from "./heroContent";

export function ProofSection() {
  return (
    <section data-reveal className="bg-[#111110] py-20 md:py-24 overflow-hidden">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#FCFCFA]/40">
          12 años, marcas reales
        </p>

        <h2 className="mt-6 font-ultra text-[clamp(30px,6vw,96px)] md:text-[min(5vw,8vh)] leading-[0.95] text-[#FCFCFA]/30">
          Venimos de ser brand managers y socios de crecimiento de
        </h2>

        <p className="mt-6 md:mt-8 font-ultra text-[clamp(26px,5vw,72px)] md:text-[min(4.4vw,7vh)] leading-[1.02] text-[#FCFCFA]/25">
          {BRANDS_MANAGED.map((c, i) => (
            <span key={c}>
              <span className="text-[#FCFCFA]/75 transition-colors duration-300 hover:text-[#FCFCFA]">
                {c}
              </span>
              {i < BRANDS_MANAGED.length - 1 ? ", " : " y muchas más."}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
