// supabase/functions/telegram/index.ts
// هدف: إرسال إشعار تلجرام (طلب / رسالة تواصل) بدون كشف التوكن في المتصفح


export const config = {
  verify_jwt: false,
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const BOT = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const CHAT = Deno.env.get("TELEGRAM_CHAT_ID") ?? "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
    }
  });
}

function esc(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true }, 200);

  if (!BOT || !CHAT) {
    return json({ error: "Missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID in Supabase Secrets" }, 500);
  }

  let body: any = {};
  try { body = await req.json(); } catch {}

  const type = String(body?.type || "").toLowerCase();

  let text = "";
  if (type === "contact") {
    text =
      `<b>📩 Yeni Mesaj (İletişim)</b>\n` +
      `<b>Restoran:</b> ${esc(body.restaurant || "KARZOUN LOKANTASI")}\n\n` +
      `<b>Ad Soyad:</b> ${esc(body.name || "")}\n` +
      `<b>Telefon:</b> ${esc(body.phone || "")}\n` +
      `<b>E-posta:</b> ${esc(body.email || "")}\n` +
      `<b>Konu:</b> ${esc(body.subject || "")}\n` +
      `<b>Mesaj:</b> ${esc(body.message || "")}\n`;
  } else if (type === "order") {
    const items = Array.isArray(body.items) ? body.items : [];
    const lines = items.map((it: any) => {
      const n = esc(String(it.name || "Ürün"));
      const q = Number(it.qty || 1);
      const p = Number(it.price || 0);
      return `• ${n} x${q} (${p} ₺)`;
    }).join("\n");

    text =
      `<b>🛒 Yeni Sipariş</b>\n` +
      `<b>Restoran:</b> ${esc(body.restaurant || "KARZOUN LOKANTASI")}\n` +
      (body.order_id ? `<b>Order ID:</b> ${esc(String(body.order_id))}\n` : "") +
      `\n<b>Müşteri:</b>\n` +
      `• ${esc(body.customer?.name || "")}\n` +
      `• ${esc(body.customer?.phone || "")}\n` +
      `• ${esc(body.customer?.address || "")}\n` +
      (body.customer?.note ? `\n<b>Not:</b> ${esc(String(body.customer.note))}\n` : "") +
      `\n<b>Ürünler:</b>\n${lines}\n` +
      `\n<b>Toplam:</b> ${esc(String(body.total || ""))} ₺\n`;
  } else {
    return json({ error: "type must be 'contact' or 'order'" }, 400);
  }

  const tg = await fetch(`https://api.telegram.org/bot${BOT}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true
    })
  });

  const out = await tg.json().catch(() => ({}));
  if (!out.ok) return json({ error: out.description || "Telegram send failed" }, 500);

  return json({ ok: true }, 200);
});
