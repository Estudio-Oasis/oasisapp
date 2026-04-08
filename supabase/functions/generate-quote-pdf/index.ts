import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal PDF builder — zero deps, works in Deno edge runtime
// We build the PDF manually because heavy libs like jsPDF don't work reliably in edge functions.

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

    // Fetch quote
    const { data: quote, error: qErr } = await supabaseAdmin
      .from("quotes")
      .select("*")
      .eq("id", quote_id)
      .single();
    if (qErr || !quote) {
      return new Response(JSON.stringify({ error: "Quote not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch items
    const { data: items } = await supabaseAdmin
      .from("quote_items")
      .select("*")
      .eq("quote_id", quote_id)
      .order("sort_order");

    // Fetch client
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("name, contact_name, email")
      .eq("id", quote.client_id)
      .single();

    // Fetch agency
    const { data: agency } = await supabaseAdmin
      .from("agencies")
      .select("name, legal_name, fiscal_address, tax_id, bank_name, bank_account_number, bank_clabe, bank_swift, bank_routing")
      .eq("id", quote.agency_id)
      .single();

    // Fetch agency_settings
    const { data: settings } = await supabaseAdmin
      .from("agency_settings")
      .select("company_name, company_address, company_email, company_phone, bank_info, logo_url")
      .eq("agency_id", quote.agency_id)
      .single();

    // Build HTML for PDF
    const agencyName = settings?.company_name || agency?.name || "—";
    const agencyAddress = settings?.company_address || agency?.fiscal_address || "";
    const agencyEmail = settings?.company_email || "";
    const agencyPhone = settings?.company_phone || "";
    const bankInfo = settings?.bank_info || "";

    const quoteNumber = `COT-${new Date(quote.created_at).getFullYear()}-${String(quote_id.slice(0, 3)).toUpperCase()}`;

    const discountAmount = quote.discount_type === "percentage"
      ? quote.subtotal * (quote.discount_value / 100)
      : quote.discount_value;
    const afterDiscount = quote.subtotal - discountAmount;
    const taxAmount = quote.tax_enabled ? afterDiscount * (quote.tax_rate / 100) : 0;

    const fmt = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const itemRows = (items || []).map((it: any) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#1a1a1a">${escHtml(it.description)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#666;text-align:center">${it.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#666;text-align:center">${it.unit}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#666;text-align:right">${fmt(it.unit_price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#1a1a1a;text-align:right;font-weight:600">${fmt(it.quantity * it.unit_price)}</td>
      </tr>
    `).join("");

    let totalsRows = `
      <tr><td colspan="4" style="text-align:right;padding:8px 12px;font-size:13px;color:#666">Subtotal</td>
          <td style="text-align:right;padding:8px 12px;font-size:13px;font-weight:600">${fmt(quote.subtotal)}</td></tr>
    `;
    if (quote.discount_value > 0) {
      const discLabel = quote.discount_type === "percentage" ? `${quote.discount_value}%` : fmt(quote.discount_value);
      totalsRows += `<tr><td colspan="4" style="text-align:right;padding:8px 12px;font-size:13px;color:#666">Descuento (${discLabel})</td>
          <td style="text-align:right;padding:8px 12px;font-size:13px;color:#c00">-${fmt(discountAmount)}</td></tr>`;
    }
    if (quote.tax_enabled) {
      totalsRows += `<tr><td colspan="4" style="text-align:right;padding:8px 12px;font-size:13px;color:#666">IVA (${quote.tax_rate}%)</td>
          <td style="text-align:right;padding:8px 12px;font-size:13px">${fmt(taxAmount)}</td></tr>`;
    }
    totalsRows += `<tr><td colspan="4" style="text-align:right;padding:12px;font-size:16px;font-weight:700;color:#1a1a1a;border-top:2px solid #1a1a1a">TOTAL</td>
        <td style="text-align:right;padding:12px;font-size:16px;font-weight:700;color:#1a1a1a;border-top:2px solid #1a1a1a">${fmt(quote.total_amount)} ${quote.currency}</td></tr>`;

    const logoHtml = settings?.logo_url
      ? `<img src="${settings.logo_url}" alt="Logo" style="max-height:60px;max-width:180px;object-fit:contain" />`
      : "";

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin:0;padding:40px 50px;color:#1a1a1a;font-size:13px;line-height:1.5}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px;padding-bottom:20px;border-bottom:2px solid #1a1a1a}
  .agency-info{text-align:right}
  .agency-name{font-size:22px;font-weight:700;color:#1a1a1a;margin-bottom:4px}
  .agency-detail{font-size:11px;color:#666;margin:0}
  .quote-meta{display:flex;justify-content:space-between;margin-bottom:30px}
  .meta-block h3{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#999;margin:0 0 6px}
  .meta-block p{margin:2px 0;font-size:13px}
  table{width:100%;border-collapse:collapse}
  .items-header th{background:#f5f5f5;padding:10px 12px;font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#666;font-weight:600;border-bottom:2px solid #ddd}
  .section-title{font-size:14px;font-weight:700;color:#1a1a1a;margin:30px 0 10px;padding-bottom:6px;border-bottom:1px solid #e5e5e5}
  .terms-text{font-size:12px;color:#444;white-space:pre-wrap;line-height:1.6}
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e5e5;font-size:10px;color:#999;text-align:center}
</style></head><body>

<div class="header">
  <div>${logoHtml}</div>
  <div class="agency-info">
    <div class="agency-name">${escHtml(agencyName)}</div>
    ${agencyAddress ? `<p class="agency-detail">${escHtml(agencyAddress)}</p>` : ""}
    ${agencyEmail ? `<p class="agency-detail">${escHtml(agencyEmail)}</p>` : ""}
    ${agencyPhone ? `<p class="agency-detail">${escHtml(agencyPhone)}</p>` : ""}
  </div>
</div>

<h1 style="font-size:28px;font-weight:300;color:#1a1a1a;margin:0 0 20px;letter-spacing:-0.5px">COTIZACIÓN</h1>

<div class="quote-meta">
  <div class="meta-block">
    <h3>Cotización</h3>
    <p><strong>${quoteNumber}</strong></p>
    <p>Fecha: ${new Date(quote.created_at).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</p>
    ${quote.valid_until ? `<p>Válida hasta: ${new Date(quote.valid_until).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
  </div>
  <div class="meta-block" style="text-align:right">
    <h3>Cliente</h3>
    <p><strong>${escHtml(client?.name || "—")}</strong></p>
    ${client?.contact_name ? `<p>${escHtml(client.contact_name)}</p>` : ""}
    ${client?.email ? `<p>${escHtml(client.email)}</p>` : ""}
  </div>
</div>

${quote.description ? `<div class="section-title">Alcance del trabajo</div><p class="terms-text">${escHtml(quote.description)}</p>` : ""}

<div class="section-title">Detalle</div>
<table>
  <thead><tr class="items-header">
    <th style="text-align:left">Descripción</th>
    <th style="text-align:center">Cant.</th>
    <th style="text-align:center">Unidad</th>
    <th style="text-align:right">P. Unitario</th>
    <th style="text-align:right">Subtotal</th>
  </tr></thead>
  <tbody>${itemRows}</tbody>
  <tfoot>${totalsRows}</tfoot>
</table>

${quote.payment_terms ? `<div class="section-title">Condiciones de pago</div><p class="terms-text">${escHtml(quote.payment_terms)}</p>` : ""}

${quote.notes_to_client ? `<div class="section-title">Notas</div><p class="terms-text">${escHtml(quote.notes_to_client)}</p>` : ""}

${bankInfo ? `<div class="section-title">Datos bancarios</div><p class="terms-text">${escHtml(bankInfo)}</p>` : ""}

<div class="footer">
  Cotización generada con OasisOS
</div>

</body></html>`;

    // Store HTML as PDF placeholder — we'll use a service or just store HTML
    // For v1, store the HTML and let the client render/print it
    const fileName = `quote-${quote_id}.html`;
    const blob = new Blob([html], { type: "text/html" });
    const arrayBuffer = await blob.arrayBuffer();

    const { error: uploadErr } = await supabaseAdmin.storage
      .from("quote-pdfs")
      .upload(fileName, new Uint8Array(arrayBuffer), {
        contentType: "text/html",
        upsert: true,
      });

    if (uploadErr) {
      console.error("Upload error:", uploadErr);
      return new Response(JSON.stringify({ error: "Failed to upload PDF" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("quote-pdfs")
      .getPublicUrl(fileName);

    // Since bucket is not public, generate signed URL
    const { data: signedData } = await supabaseAdmin.storage
      .from("quote-pdfs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 30); // 30 days

    const pdfUrl = signedData?.signedUrl || urlData?.publicUrl || "";

    // Update quote with pdf_url
    await supabaseAdmin
      .from("quotes")
      .update({ pdf_url: pdfUrl })
      .eq("id", quote_id);

    return new Response(
      JSON.stringify({ success: true, url: pdfUrl, html }),
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

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\n/g, "<br>");
}
