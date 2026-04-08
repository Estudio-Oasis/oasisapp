import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { quote_id } = await req.json();
    if (!quote_id) {
      return new Response(JSON.stringify({ error: "quote_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all data in parallel
    const [quoteRes, itemsRes] = await Promise.all([
      supabaseAdmin.from("quotes").select("*").eq("id", quote_id).single(),
      supabaseAdmin.from("quote_items").select("*").eq("quote_id", quote_id).order("sort_order"),
    ]);

    const quote = quoteRes.data;
    if (!quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const items = itemsRes.data || [];

    const [clientRes, agencyRes, settingsRes] = await Promise.all([
      supabaseAdmin.from("clients").select("name, contact_name, email, phone").eq("id", quote.client_id).single(),
      supabaseAdmin.from("agencies").select("name, legal_name, fiscal_address, tax_id, bank_name, bank_account_number, bank_clabe, bank_swift, bank_routing").eq("id", quote.agency_id).single(),
      supabaseAdmin.from("agency_settings").select("company_name, company_address, company_email, company_phone, bank_info, logo_url").eq("agency_id", quote.agency_id).single(),
    ]);

    const client = clientRes.data;
    const agency = agencyRes.data;
    const settings = settingsRes.data;

    const agencyName = settings?.company_name || agency?.legal_name || agency?.name || "";
    const agencyAddress = settings?.company_address || agency?.fiscal_address || "";
    const agencyEmail = settings?.company_email || "";
    const agencyPhone = settings?.company_phone || "";
    const bankInfo = settings?.bank_info || "";
    const logoUrl = settings?.logo_url || "";

    // Quote number
    const createdDate = new Date(quote.created_at);
    const quoteNumber = `COT-${createdDate.getFullYear()}-${String(quote_id.slice(0, 3)).toUpperCase()}`;

    // Calculations
    const discountAmount = quote.discount_type === "percentage"
      ? quote.subtotal * (quote.discount_value / 100)
      : quote.discount_value;
    const afterDiscount = quote.subtotal - discountAmount;
    const taxAmount = quote.tax_enabled ? afterDiscount * (quote.tax_rate / 100) : 0;

    const fmt = (n: number) => {
      const parts = Math.abs(n).toFixed(2).split(".");
      const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      return `$${n < 0 ? "-" : ""}${intPart}.${parts[1]}`;
    };

    const fmtDate = (d: string) => {
      const date = new Date(d);
      const months = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
      return `${date.getUTCDate()} de ${months[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
    };

    // Build item rows
    const itemRows = items.map((it: any) => `
      <tr>
        <td class="td-desc">${esc(it.description)}</td>
        <td class="td-center">${it.quantity}</td>
        <td class="td-center">${it.unit}</td>
        <td class="td-right">${fmt(it.unit_price)}</td>
        <td class="td-right td-bold">${fmt(it.quantity * it.unit_price)}</td>
      </tr>`).join("");

    // Build totals
    let totalsHtml = `
      <tr class="totals-row">
        <td colspan="4" class="totals-label">Subtotal</td>
        <td class="totals-value">${fmt(quote.subtotal)}</td>
      </tr>`;

    if (quote.discount_value > 0) {
      const dl = quote.discount_type === "percentage" ? `${quote.discount_value}%` : fmt(quote.discount_value);
      totalsHtml += `
      <tr class="totals-row">
        <td colspan="4" class="totals-label">Descuento (${dl})</td>
        <td class="totals-value" style="color:#b91c1c">-${fmt(discountAmount)}</td>
      </tr>`;
    }

    if (quote.tax_enabled) {
      totalsHtml += `
      <tr class="totals-row">
        <td colspan="4" class="totals-label">IVA (${quote.tax_rate}%)</td>
        <td class="totals-value">${fmt(taxAmount)}</td>
      </tr>`;
    }

    totalsHtml += `
      <tr class="totals-grand">
        <td colspan="4" class="grand-label">TOTAL</td>
        <td class="grand-value">${fmt(quote.total_amount)} ${esc(quote.currency)}</td>
      </tr>`;

    // Logo HTML
    const logoHtml = logoUrl
      ? `<img src="${esc(logoUrl)}" alt="Logo" class="logo" />`
      : `<div class="logo-placeholder"></div>`;

    // Agency details lines
    const agencyLines = [agencyAddress, agencyEmail, agencyPhone].filter(Boolean);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cotización ${esc(quoteNumber)} — ${esc(agencyName)}</title>
<style>
  @page {
    size: letter;
    margin: 0;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 8.5in;
    height: 11in;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    padding: 0.6in 0.7in 0.5in;
    display: flex;
    flex-direction: column;
    min-height: 11in;
  }

  /* ---- HEADER ---- */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 14pt;
    border-bottom: 2.5pt solid #1a1a1a;
    margin-bottom: 16pt;
  }
  .logo { max-height: 50pt; max-width: 160pt; object-fit: contain; }
  .logo-placeholder { width: 1px; }
  .agency-info { text-align: right; }
  .agency-name { font-size: 16pt; font-weight: 700; color: #1a1a1a; margin-bottom: 3pt; }
  .agency-detail { font-size: 8pt; color: #555; line-height: 1.5; }

  /* ---- TITLE ---- */
  .doc-title {
    font-size: 22pt;
    font-weight: 300;
    color: #1a1a1a;
    letter-spacing: -0.5pt;
    margin-bottom: 14pt;
  }

  /* ---- META ---- */
  .meta-grid {
    display: flex;
    justify-content: space-between;
    margin-bottom: 18pt;
  }
  .meta-block {}
  .meta-block.right { text-align: right; }
  .meta-label {
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 1pt;
    color: #888;
    font-weight: 600;
    margin-bottom: 4pt;
  }
  .meta-value { font-size: 9.5pt; line-height: 1.5; }
  .meta-value strong { font-weight: 700; }

  /* ---- SECTIONS ---- */
  .section-title {
    font-size: 10pt;
    font-weight: 700;
    color: #1a1a1a;
    margin: 16pt 0 6pt;
    padding-bottom: 4pt;
    border-bottom: 0.75pt solid #d4d4d4;
  }
  .section-text {
    font-size: 9pt;
    color: #333;
    white-space: pre-wrap;
    line-height: 1.55;
  }

  /* ---- TABLE ---- */
  table { width: 100%; border-collapse: collapse; margin-top: 4pt; }
  thead th {
    background: #f0f0f0;
    padding: 7pt 8pt;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    color: #555;
    font-weight: 600;
    border-bottom: 1.5pt solid #ccc;
  }
  thead th:first-child { text-align: left; }
  tbody td {
    padding: 7pt 8pt;
    font-size: 9pt;
    border-bottom: 0.5pt solid #e5e5e5;
  }
  .td-desc { color: #1a1a1a; }
  .td-center { text-align: center; color: #555; }
  .td-right { text-align: right; color: #555; }
  .td-bold { font-weight: 600; color: #1a1a1a; }

  /* ---- TOTALS ---- */
  .totals-row td { padding: 5pt 8pt; font-size: 9pt; border: none; }
  .totals-label { text-align: right; color: #555; }
  .totals-value { text-align: right; font-weight: 600; }
  .totals-grand td {
    padding: 8pt;
    border-top: 2pt solid #1a1a1a;
    font-size: 13pt;
    font-weight: 700;
    color: #1a1a1a;
  }
  .grand-label { text-align: right; }
  .grand-value { text-align: right; }

  /* ---- FOOTER ---- */
  .spacer { flex: 1; }
  .footer {
    margin-top: 20pt;
    padding-top: 10pt;
    border-top: 0.5pt solid #d4d4d4;
    text-align: center;
    font-size: 7.5pt;
    color: #999;
  }

  /* ---- PRINT ---- */
  @media print {
    html, body { width: auto; height: auto; }
    body { padding: 0.6in 0.7in 0.5in; }
  }

  /* ---- SCREEN: toolbar ---- */
  @media screen {
    .print-toolbar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #1a1a1a;
      color: white;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 9999;
      font-family: system-ui, sans-serif;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
    }
    .print-toolbar button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 24px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }
    .print-toolbar button:hover { background: #1d4ed8; }
    .print-toolbar span { font-size: 13px; opacity: 0.8; }
    body { margin-top: 52px; }
  }
  @media print { .print-toolbar { display: none !important; } body { margin-top: 0; } }
</style>
</head>
<body>

<div class="print-toolbar">
  <span>Vista previa — ${esc(quoteNumber)}</span>
  <button onclick="window.print()">⬇ Guardar como PDF</button>
</div>

<div class="header">
  <div>${logoHtml}</div>
  <div class="agency-info">
    <div class="agency-name">${esc(agencyName)}</div>
    ${agencyLines.map(l => `<div class="agency-detail">${esc(l)}</div>`).join("")}
  </div>
</div>

<div class="doc-title">COTIZACIÓN</div>

<div class="meta-grid">
  <div class="meta-block">
    <div class="meta-label">Cotización</div>
    <div class="meta-value">
      <strong>${esc(quoteNumber)}</strong><br>
      Fecha: ${fmtDate(quote.created_at)}
      ${quote.valid_until ? `<br>Válida hasta: ${fmtDate(quote.valid_until)}` : ""}
    </div>
  </div>
  <div class="meta-block right">
    <div class="meta-label">Cliente</div>
    <div class="meta-value">
      <strong>${esc(client?.name || "—")}</strong>
      ${client?.contact_name ? `<br>${esc(client.contact_name)}` : ""}
      ${client?.email ? `<br>${esc(client.email)}` : ""}
      ${client?.phone ? `<br>${esc(client.phone)}` : ""}
    </div>
  </div>
</div>

${quote.description ? `
<div class="section-title">Alcance del trabajo</div>
<div class="section-text">${esc(quote.description)}</div>
` : ""}

<div class="section-title">Detalle</div>
<table>
  <thead>
    <tr>
      <th style="text-align:left;width:40%">Descripción</th>
      <th style="text-align:center;width:10%">Cant.</th>
      <th style="text-align:center;width:12%">Unidad</th>
      <th style="text-align:right;width:18%">P. Unitario</th>
      <th style="text-align:right;width:20%">Subtotal</th>
    </tr>
  </thead>
  <tbody>${itemRows}</tbody>
  <tfoot>${totalsHtml}</tfoot>
</table>

${quote.payment_terms ? `
<div class="section-title">Condiciones de pago</div>
<div class="section-text">${esc(quote.payment_terms)}</div>
` : ""}

${quote.notes_to_client ? `
<div class="section-title">Notas</div>
<div class="section-text">${esc(quote.notes_to_client)}</div>
` : ""}

${bankInfo ? `
<div class="section-title">Datos bancarios</div>
<div class="section-text">${esc(bankInfo)}</div>
` : ""}

<div class="spacer"></div>
<div class="footer">Cotización generada con OasisOS</div>

</body>
</html>`;

    // Return HTML directly — client opens as blob URL for print-to-PDF
    return new Response(
      JSON.stringify({ success: true, html }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}
