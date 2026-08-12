import { Link } from "react-router-dom";

export function ClosingCTA() {
  return (
    <section data-reveal className="bg-[hsl(var(--ink))] py-24 md:py-28">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-label text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--paper)/0.40)]">
          Siguiente paso
        </p>
        <h2 className="mt-6 font-ultra leading-[0.85] text-[clamp(56px,14vw,260px)] md:text-[min(11.5vw,17vh)] text-[hsl(var(--paper))]">
          <span className="block">Cuéntanos</span>
          <span className="block text-[#E8453C]">qué está roto.</span>
        </h2>
        <p className="mt-8 font-condensed text-[clamp(18px,3.4vw,40px)] md:text-[min(2.4vw,4vh)] leading-[1.06] text-[hsl(var(--paper)/0.50)] max-w-[40ch]">
          Respondemos en menos de 24 horas, con diagnóstico, no con propuesta genérica.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/contacto"
            className="font-label text-[11px] tracking-[0.2em] uppercase px-7 py-4 bg-[hsl(var(--paper))] text-[hsl(var(--ink))] hover:bg-[#E8453C] hover:text-[hsl(var(--paper))] transition-colors"
          >
            Escribirnos
          </Link>
          <a
            href="https://wa.me/525667701206"
            target="_blank"
            rel="noopener noreferrer"
            className="font-label text-[11px] tracking-[0.2em] uppercase px-7 py-4 border border-[hsl(var(--paper)/0.25)] text-[hsl(var(--paper))] hover:border-[hsl(var(--paper))] transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
