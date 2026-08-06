import { Link } from "react-router-dom";

export function ClosingCTA() {
  return (
    <section data-reveal className="bg-[#111110] py-24 md:py-28">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-mono-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#FCFCFA]/40">
          Siguiente paso
        </p>
        <h2 className="mt-6 font-ultra leading-[0.85] text-[clamp(56px,14vw,260px)] md:text-[min(11.5vw,17vh)] text-[#FCFCFA]">
          <span className="block">Cuéntanos</span>
          <span className="block text-[#E8453C]">qué está roto.</span>
        </h2>
        <p className="mt-8 font-condensed text-[clamp(18px,3.4vw,40px)] md:text-[min(2.4vw,4vh)] leading-[1.06] text-[#FCFCFA]/50 max-w-[40ch]">
          Respondemos en menos de 24 horas, con diagnóstico, no con propuesta genérica.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/contacto"
            className="font-mono-label text-[11px] tracking-[0.2em] uppercase px-7 py-4 bg-[#FCFCFA] text-[#111110] hover:bg-[#E8453C] hover:text-[#FCFCFA] transition-colors"
          >
            Escribirnos
          </Link>
          <a
            href="https://wa.me/525667701206"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono-label text-[11px] tracking-[0.2em] uppercase px-7 py-4 border border-[#FCFCFA]/25 text-[#FCFCFA] hover:border-[#FCFCFA] transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
