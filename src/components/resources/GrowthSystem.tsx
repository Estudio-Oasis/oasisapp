import { useMemo, useState } from "react";
import { useLang } from "@/i18n/LanguageContext";
import { WaitlistForm } from "@/components/resources/WaitlistForm";
import { paths, systemCapabilities } from "@/components/resources/colectivoContent";

const num = (v: string) => {
  const n = Number(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function AdGapCalculator() {
  const { t } = useLang();
  const [v, setV] = useState({ clients: "20", close: "20", organic: "65", cpl: "300" });
  const result = useMemo(() => {
    const clients = num(v.clients);
    const close = num(v.close);
    const organic = num(v.organic);
    const cpl = num(v.cpl);
    const needed = close > 0 ? Math.ceil((clients * 100) / close) : 0;
    const gap = Math.max(0, needed - organic);
    return { needed, gap, budget: Math.round(gap * cpl) };
  }, [v]);

  const field = (key: keyof typeof v, label: string) => (
    <label className="block">
      <span className="font-label text-[hsl(var(--ink)/0.45)]">{label}</span>
      <input
        inputMode="numeric"
        value={v[key]}
        onChange={(e) => setV((p) => ({ ...p, [key]: e.target.value }))}
        className="mt-2 w-full h-12 px-3 bg-transparent border-2 border-[hsl(var(--ink)/0.18)] focus:border-[hsl(var(--ink))] outline-none tabular-nums text-[hsl(var(--ink))]"
      />
    </label>
  );

  return (
    <div className="mt-10 border-2 border-[hsl(var(--ink))] p-5 md:p-8">
      <p className="font-label text-[#C5221F]">{t("Cuándo sí conviene pagar publicidad", "When paying for ads actually makes sense")}</p>
      <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-[hsl(var(--ink)/0.6)]">
        {t(
          "La publicidad no arregla un negocio; compra el volumen que le falta a algo que ya funciona. Haz la cuenta con tus números.",
          "Ads do not fix a business; they buy the volume missing from something that already works. Run the numbers with yours.",
        )}
      </p>
      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {field("clients", t("Clientes nuevos que quieres al mes", "New customers you want per month"))}
        {field("close", t("De cada 100 prospectos, ¿cuántos cierras?", "Out of 100 prospects, how many close?"))}
        {field("organic", t("Prospectos que ya llegan solos", "Prospects that already come on their own"))}
        {field("cpl", t("Cuánto puedes pagar por prospecto (MXN)", "What you can pay per prospect (MXN)"))}
      </div>
      <div className="mt-7 grid sm:grid-cols-3 border-t-2 border-[hsl(var(--ink))]">
        {[
          [t("Prospectos necesarios", "Prospects needed"), result.needed.toLocaleString("es-MX")],
          [t("Los que te faltan", "The ones you are missing"), result.gap.toLocaleString("es-MX")],
          [t("Inversión para comprarlos", "Budget to buy them"), `$${result.budget.toLocaleString("es-MX")}`],
        ].map(([label, value], i) => (
          <div
            key={label}
            className={`py-5 sm:px-5 ${i === 0 ? "sm:pl-0" : ""} border-b sm:border-b-0 sm:border-r last:border-r-0 border-[hsl(var(--ink)/0.15)]`}
          >
            <p className="font-label text-[hsl(var(--ink)/0.45)]">{label}</p>
            <p className="mt-2 font-ultra text-[clamp(34px,5vw,58px)] leading-none tabular-nums text-[hsl(var(--ink))]">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-[14px] leading-relaxed text-[hsl(var(--ink)/0.5)]">
        {t(
          "Si el número te incomoda, el problema no es el presupuesto: es el margen, la oferta o el seguimiento.",
          "If the number makes you uncomfortable, the problem is not the budget: it is margin, offer, or follow-up.",
        )}
      </p>
    </div>
  );
}

export function GrowthSystem() {
  const { t, pick } = useLang();
  return (
    <section id="sistema" className="border-t-2 border-[hsl(var(--ink))] py-14 md:py-24 scroll-mt-28">
      <div className="max-w-[1700px] mx-auto px-4 md:px-6">
        <p className="font-label text-[#C5221F]">06 / 06 · {t("El sistema", "The system")}</p>
        <h2
          data-reveal
          className="mt-5 max-w-[14ch] font-ultra text-[clamp(42px,9vw,140px)] leading-[0.88] text-[hsl(var(--ink))]"
        >
          {t("Deja de rentar tu marketing.", "Stop renting your marketing.")}
        </h2>
        <p className="mt-7 max-w-[62ch] font-condensed text-[clamp(22px,3.4vw,42px)] leading-[1.06] text-[hsl(var(--ink)/0.55)]">
          {t(
            "Construye una máquina que siga funcionando aunque mañana cambies de agencia.",
            "Build a machine that keeps working even if you change agencies tomorrow.",
          )}
        </p>

        <div className="mt-12 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16">
          <div>
            <p className="font-label text-[hsl(var(--ink)/0.42)]">
              {t("Después del diagnóstico hay tres caminos", "After the diagnosis there are three paths")}
            </p>
            <div className="mt-5 border-t-2 border-[hsl(var(--ink))]">
              {paths.map((p, i) => (
                <div key={p.title.es} data-reveal className="py-6 border-b border-[hsl(var(--ink)/0.15)] flex gap-5 md:gap-8">
                  <span className="font-ultra text-[clamp(30px,4vw,52px)] leading-none text-[#C5221F]">0{i + 1}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-condensed text-[clamp(23px,3vw,34px)] leading-none text-[hsl(var(--ink))]">{pick(p.title)}</h3>
                      <span className="border border-[hsl(var(--ink)/0.25)] px-2 py-1 font-label text-[hsl(var(--ink)/0.5)]">{pick(p.status)}</span>
                    </div>
                    <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-[hsl(var(--ink)/0.58)]">{pick(p.body)}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-10 font-label text-[hsl(var(--ink)/0.42)]">
              {t("Lo que el sistema va a resolver", "What the system will handle")}
            </p>
            <ul className="mt-4 grid sm:grid-cols-2 gap-x-8">
              {systemCapabilities.map((c) => (
                <li
                  key={c.es}
                  className="py-3 border-b border-[hsl(var(--ink)/0.13)] text-[15px] text-[hsl(var(--ink)/0.65)]"
                >
                  {pick(c)}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="border-2 border-[hsl(var(--ink)/0.15)] p-5 md:p-7">
              <p className="font-label text-[#C5221F]">{t("Próximamente", "Coming soon")}</p>
              <h3 className="mt-4 font-condensed text-[clamp(26px,3.6vw,40px)] leading-[1.04] text-[hsl(var(--ink))]">
                {t(
                  "El sistema de crecimiento de Oasis, en tu propio negocio.",
                  "The Oasis growth system, inside your own business.",
                )}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-[hsl(var(--ink)/0.58)]">
                {t(
                  "Es el mismo proceso comercial que usamos con nuestros clientes, ordenado para que tu equipo lo opere. Todavía lo estamos armando: no hay demo, ni precio final, ni promesas de leads.",
                  "It is the same commercial process we run with our clients, arranged so your team can operate it. We are still building it: no demo, no final price, no lead promises.",
                )}
              </p>
              <div className="mt-6">
                <WaitlistForm />
              </div>
            </div>
          </div>
        </div>

        <p
          data-reveal
          className="mt-14 md:mt-20 border-l-4 border-[#C5221F] pl-5 font-ultra text-[clamp(30px,6vw,86px)] leading-[0.94] text-[hsl(var(--ink))]"
        >
          {t("PAUTA COMO ACELERADOR. NO COMO RESPIRADOR ARTIFICIAL.", "ADS AS AN ACCELERATOR. NOT AS LIFE SUPPORT.")}
        </p>

        <AdGapCalculator />
      </div>
    </section>
  );
}
