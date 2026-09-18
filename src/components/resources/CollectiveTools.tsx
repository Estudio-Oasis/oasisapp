import { useMemo, useState } from "react";
import { Copy, Printer } from "lucide-react";
import { toast } from "sonner";
import { useLang, type Bi } from "@/i18n/LanguageContext";

const smokeQuestions: Bi[] = [
  { es: "¿Hablan de impresiones o leads, pero casi nunca de clientes, margen o caja?", en: "Do they discuss impressions or leads, but rarely customers, margin, or cash?" },
  { es: "¿Desconocen tus márgenes y cuánto puedes pagar por adquirir un cliente?", en: "Do they not know your margins or what you can afford to acquire a customer?" },
  { es: "¿Cambian campañas sin documentar qué intentan aprender?", en: "Do they change campaigns without documenting what they are trying to learn?" },
  { es: "¿Atribuyen prácticamente todas las ventas a sus campañas?", en: "Do they attribute nearly every sale to their campaigns?" },
  { es: "¿Nunca han recomendado reducir o reasignar presupuesto?", en: "Have they never recommended reducing or reallocating budget?" },
  { es: "¿Ignoran lo que ocurre después de generar un lead?", en: "Do they ignore what happens after generating a lead?" },
  { es: "¿No pueden explicar qué aprendieron en los últimos 90 días?", en: "Can they not explain what they learned in the last 90 days?" },
];

function SmokeDetector() {
  const { t, pick } = useLang();
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const score = Object.values(answers).filter(Boolean).length;
  const complete = Object.keys(answers).length === smokeQuestions.length;
  const result = score <= 2
    ? { title: t("Hay conversación, no sentencia.", "There is a conversation, not a verdict."), body: t("Hay pocas señales, pero pide una tesis, aprendizajes y conexión con resultados de negocio.", "There are few signals, but ask for a thesis, learnings, and a link to business outcomes.") }
    : score <= 4
      ? { title: t("Necesitas más claridad.", "You need more clarity."), body: t("Hay señales suficientes para revisar objetivos, economía y decisiones con tu proveedor.", "There are enough signals to review goals, economics, and decisions with your provider.") }
      : { title: t("Haz una revisión seria.", "Run a serious review."), body: t("La relación parece concentrarse en actividad. Revisa acceso, datos, hipótesis y próximos 90 días antes de invertir más.", "The relationship appears focused on activity. Review access, data, hypotheses, and the next 90 days before investing more.") };

  return (
    <section id="detector" className="border-t-2 border-[hsl(var(--ink))] py-14 md:py-24 scroll-mt-20">
      <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-10 lg:gap-20">
        <div>
          <p className="font-label text-[hsl(var(--ink)/0.4)]">03 · {t("Detector", "Detector")}</p>
          <h2 className="mt-4 font-ultra text-[clamp(36px,7vw,100px)] leading-[0.92] text-[hsl(var(--ink))]">{t("¿Marketing o performance theater?", "Marketing or performance theater?")}</h2>
          <p className="mt-5 max-w-[52ch] text-[15px] md:text-[17px] text-[hsl(var(--ink)/0.55)]">{t("No es un diagnóstico científico ni una sentencia. Es una herramienta para hacer mejores preguntas.", "This is not a scientific diagnosis or a verdict. It is a tool for asking better questions.")}</p>
        </div>
        <div className="border-t-2 border-[hsl(var(--ink))]">
          {smokeQuestions.map((q, i) => (
            <div key={q.es} className="py-5 border-b border-[hsl(var(--ink)/0.15)] grid grid-cols-[1fr_auto] gap-4 items-center">
              <p className="text-[14px] md:text-[16px] leading-relaxed text-[hsl(var(--ink)/0.78)]"><span className="font-label text-[hsl(var(--ink)/0.35)] mr-3">0{i + 1}</span>{pick(q)}</p>
              <div className="flex gap-1" role="group" aria-label={pick(q)}>
                {[false, true].map((value) => <button key={String(value)} type="button" onClick={() => setAnswers((p) => ({ ...p, [i]: value }))} className={`h-10 min-w-12 px-3 border font-label transition-colors ${answers[i] === value ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))] border-[hsl(var(--ink))]" : "border-[hsl(var(--ink)/0.2)] text-[hsl(var(--ink)/0.5)]"}`}>{value ? t("Sí", "Yes") : "No"}</button>)}
              </div>
            </div>
          ))}
          <div aria-live="polite" className={`mt-6 p-6 border-2 transition-opacity ${complete ? "opacity-100 border-[#C5221F]" : "opacity-45 border-[hsl(var(--ink)/0.15)]"}`}>
            <p className="font-label text-[#C5221F]">{complete ? `${score}/${smokeQuestions.length} ${t("señales", "signals")}` : t("Responde todas para ver tu lectura", "Answer all to see your reading")}</p>
            {complete && <><h3 className="mt-3 font-condensed text-[clamp(24px,4vw,40px)] leading-none text-[hsl(var(--ink))]">{result.title}</h3><p className="mt-3 text-[15px] leading-relaxed text-[hsl(var(--ink)/0.65)]">{result.body}</p></>}
          </div>
        </div>
      </div>
    </section>
  );
}

function EconomicsCalculator() {
  const { t } = useLang();
  const [spend, setSpend] = useState(100000);
  const [customers, setCustomers] = useState(40);
  const [ticket, setTicket] = useState(5000);
  const [margin, setMargin] = useState(45);
  const [repeat, setRepeat] = useState(1);
  const cac = customers > 0 ? spend / customers : 0;
  const contribution = ticket * (margin / 100);
  const value = contribution * Math.max(1, repeat);
  const payback = contribution > 0 ? cac / contribution : 0;
  const healthy = value >= cac;
  const Field = ({ label, value, set, suffix = "$" }: { label: string; value: number; set: (n: number) => void; suffix?: string }) => <label className="block"><span className="font-label text-[hsl(var(--ink)/0.45)]">{label}</span><div className="mt-2 flex items-center border-b-2 border-[hsl(var(--ink)/0.2)] focus-within:border-[#C5221F]"><span className="font-condensed text-[22px] text-[hsl(var(--ink)/0.35)]">{suffix}</span><input type="number" min="0" value={value} onChange={(e) => set(Math.max(0, Number(e.target.value)))} className="w-full bg-transparent px-2 py-3 outline-none font-condensed text-[clamp(22px,4vw,38px)] text-[hsl(var(--ink))]" /></div></label>;
  return <section id="calculadora" className="border-t-2 border-[hsl(var(--ink))] py-14 md:py-24 scroll-mt-20"><p className="font-label text-[hsl(var(--ink)/0.4)]">04 · {t("Growth economics", "Growth economics")}</p><div className="mt-5 grid lg:grid-cols-2 gap-10 lg:gap-20"><div><h2 className="font-ultra text-[clamp(36px,7vw,100px)] leading-[0.92] text-[hsl(var(--ink))]">{t("Las matemáticas que sí importan.", "The math that actually matters.")}</h2><p className="mt-5 max-w-[55ch] text-[15px] md:text-[17px] text-[hsl(var(--ink)/0.55)]">{t("Una lectura simplificada para conversar con criterio. No sustituye tu modelo financiero.", "A simplified reading for a better conversation. It does not replace your financial model.")}</p><div className="mt-8 grid sm:grid-cols-2 gap-7"><Field label={t("Inversión mensual", "Monthly spend")} value={spend} set={setSpend}/><Field label={t("Clientes nuevos", "New customers")} value={customers} set={setCustomers} suffix="×"/><Field label={t("Ticket promedio", "Average order")} value={ticket} set={setTicket}/><Field label={t("Margen de contribución %", "Contribution margin %")} value={margin} set={setMargin} suffix="%"/><Field label={t("Compras por cliente", "Purchases per customer")} value={repeat} set={setRepeat} suffix="×"/></div></div><div className="bg-[hsl(var(--ink))] text-[hsl(var(--paper))] p-6 md:p-10 self-start"><p className="font-label text-[hsl(var(--paper)/0.4)]">{t("Lectura rápida", "Quick read")}</p><div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8"><div><span className="font-label text-[hsl(var(--paper)/0.4)]">CAC</span><strong className="block font-ultra text-[clamp(30px,6vw,66px)] leading-none">${Math.round(cac).toLocaleString()}</strong></div><div><span className="font-label text-[hsl(var(--paper)/0.4)]">{t("Contribución", "Contribution")}</span><strong className="block font-ultra text-[clamp(30px,6vw,66px)] leading-none">${Math.round(contribution).toLocaleString()}</strong></div><div><span className="font-label text-[hsl(var(--paper)/0.4)]">Payback</span><strong className="block font-ultra text-[clamp(30px,6vw,66px)] leading-none">{payback.toFixed(1)}×</strong></div><div><span className="font-label text-[hsl(var(--paper)/0.4)]">{t("Valor", "Value")}</span><strong className="block font-ultra text-[clamp(30px,6vw,66px)] leading-none">${Math.round(value).toLocaleString()}</strong></div></div><p className={`mt-8 border-t pt-5 text-[15px] leading-relaxed ${healthy ? "text-[hsl(var(--paper))]" : "text-[#F28B82]"}`}>{healthy ? t("El margen acumulado supera el costo de adquisición. Ahora revisa tiempo de recuperación, operación y retención.", "Accumulated contribution exceeds acquisition cost. Now review recovery time, operations, and retention.") : t("Adquirir cuesta más que el margen estimado. Antes de escalar, revisa oferta, precio, conversión o retención.", "Acquisition costs more than estimated contribution. Before scaling, review offer, pricing, conversion, or retention.")}</p></div></div></section>;
}

function HypothesisBuilder() {
  const { t } = useLang();
  const [fields, setFields] = useState({ action: "", segment: "", behavior: "", metric: "", reason: "", budget: "", period: "", success: "" });
  const sentence = useMemo(() => t(`Creemos que ${fields.action || "[acción]"} aplicada a ${fields.segment || "[segmento]"} provocará ${fields.behavior || "[comportamiento]"}, que moverá ${fields.metric || "[métrica de negocio]"}, porque ${fields.reason || "[evidencia]"}. Invertiremos ${fields.budget || "[$]"} durante ${fields.period || "[periodo]"}. Funcionó si ${fields.success || "[criterio]"}.`, `We believe ${fields.action || "[action]"} applied to ${fields.segment || "[segment]"} will cause ${fields.behavior || "[behavior]"}, moving ${fields.metric || "[business metric]"}, because ${fields.reason || "[evidence]"}. We will invest ${fields.budget || "[$]"} for ${fields.period || "[period]"}. It works if ${fields.success || "[criterion]"}.`), [fields, t]);
  const labels: Record<keyof typeof fields, Bi> = { action:{es:"Acción",en:"Action"},segment:{es:"Segmento",en:"Segment"},behavior:{es:"Comportamiento",en:"Behavior"},metric:{es:"Métrica de negocio",en:"Business metric"},reason:{es:"Evidencia o razón",en:"Evidence or reason"},budget:{es:"Inversión",en:"Investment"},period:{es:"Periodo",en:"Period"},success:{es:"Criterio de éxito",en:"Success criterion"} };
  const copy = async () => { await navigator.clipboard.writeText(sentence); toast.success(t("Hipótesis copiada", "Hypothesis copied")); };
  return <section id="hipotesis" className="border-t-2 border-[hsl(var(--ink))] py-14 md:py-24 scroll-mt-20"><p className="font-label text-[hsl(var(--ink)/0.4)]">05 · {t("Plantilla", "Template")}</p><h2 className="mt-4 font-ultra text-[clamp(36px,7vw,100px)] leading-[0.92] text-[hsl(var(--ink))]">{t("Convierte actividad en una hipótesis.", "Turn activity into a hypothesis.")}</h2><div className="mt-10 grid md:grid-cols-2 gap-8 md:gap-14"><div className="grid sm:grid-cols-2 gap-5">{(Object.keys(fields) as (keyof typeof fields)[]).map((key) => <label key={key}><span className="font-label text-[hsl(var(--ink)/0.4)]">{t(labels[key].es,labels[key].en)}</span><input value={fields[key]} onChange={(e)=>setFields(p=>({...p,[key]:e.target.value}))} className="mt-2 w-full bg-transparent border-b-2 border-[hsl(var(--ink)/0.2)] focus:border-[#C5221F] py-3 outline-none text-[16px] text-[hsl(var(--ink))]" /></label>)}</div><div className="border-2 border-[hsl(var(--ink))] p-6 md:p-8 self-start"><p className="font-label text-[#C5221F]">{t("Tu hipótesis", "Your hypothesis")}</p><p className="mt-5 font-condensed text-[clamp(22px,3vw,34px)] leading-[1.15] text-[hsl(var(--ink))]">{sentence}</p><button type="button" onClick={copy} className="mt-7 h-11 px-4 inline-flex items-center gap-2 bg-[hsl(var(--ink))] text-[hsl(var(--paper))] font-label"><Copy className="h-4 w-4" />{t("Copiar", "Copy")}</button></div></div></section>;
}

function Playbook() { const { t } = useLang(); return <section id="playbook" className="border-t-2 border-[hsl(var(--ink))] py-14 md:py-24 scroll-mt-20 print:border-0"><div className="flex flex-col md:flex-row md:items-end justify-between gap-6"><div><p className="font-label text-[hsl(var(--ink)/0.4)]">06 · Playbook</p><h2 className="mt-4 font-ultra text-[clamp(36px,7vw,100px)] leading-[0.92] text-[hsl(var(--ink))]">{t("Antes de invertir otro peso.", "Before investing another dollar.")}</h2></div><button type="button" onClick={()=>window.print()} className="h-12 px-5 inline-flex items-center justify-center gap-2 border-2 border-[hsl(var(--ink))] font-label text-[hsl(var(--ink))] print:hidden"><Printer className="h-4 w-4" />{t("Guardar / imprimir", "Save / print")}</button></div><ol className="mt-10 grid md:grid-cols-2 border-t-2 border-[hsl(var(--ink))]">{[t("Define el resultado empresarial, no la lista de tareas.","Define the business outcome, not the task list."),t("Confirma producto, margen, adquisición, conversión y retención.","Confirm product, margin, acquisition, conversion, and retention."),t("Escribe una hipótesis con inversión, periodo y criterio de éxito.","Write a hypothesis with investment, period, and success criterion."),t("Da acceso a ventas y operación; el marketing no vive aislado.","Share sales and operations data; marketing does not live alone."),t("Revisa aprendizajes, no sólo dashboards.","Review learnings, not only dashboards."),t("Decide qué mantener, detener o reasignar.","Decide what to keep, stop, or reallocate.")].map((x,i)=><li key={x} className="py-6 md:p-7 md:first:pl-0 border-b md:border-r border-[hsl(var(--ink)/0.15)] flex gap-4"><span className="font-ultra text-[34px] text-[#C5221F]">0{i+1}</span><span className="text-[15px] md:text-[17px] leading-relaxed text-[hsl(var(--ink)/0.72)]">{x}</span></li>)}</ol></section> }

export function CollectiveTools(){ return <><SmokeDetector/><EconomicsCalculator/><HypothesisBuilder/><Playbook/></>; }
