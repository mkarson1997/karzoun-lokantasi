// supabase/functions/assistant/index.ts
// هدف: استلام رسالة من الموقع ثم استدعاء OpenAI (الـ API KEY مخزن في Secrets داخل Supabase)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return json({ ok: true }, 200);

  if (!OPENAI_API_KEY) return json({ error: "Missing OPENAI_API_KEY in Supabase Secrets" }, 500);

  let body: any = {};
  try { body = await req.json(); } catch {}

  const userMsg = String(body?.message || "").trim();
  const history = Array.isArray(body?.history) ? body.history : [];

  if (!userMsg) return json({ error: "message is required" }, 400);

  // System prompt بسيط للمطعم
  const system = [
    "Sen KARZOUN LOKANTASI için bir yardımcı asistansın.",
    "Kısa, net cevap ver. Menü, fiyatlar, çalışma saatleri, adres, sipariş yönlendirme gibi konularda yardımcı ol.",
    "Kullanıcı Türkçe yazıyorsa Türkçe; Arapça yazıyorsa Arapça cevap ver.",
    "İddialı uydurma bilgi verme. Emin değilsen kısa soruyla netleştir."
  ].join(" ");

  // OpenAI Chat Completions
  const messages = [
    { role: "system", content: system },
    ...history.slice(-10).map((m: any) => ({ role: m.role, content: String(m.content || "") })),
    { role: "user", content: userMsg }
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages
    })
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return json({ error: data?.error?.message || "OpenAI request failed" }, 500);
  }

  const reply = data?.choices?.[0]?.message?.content ?? "";
  return json({ reply }, 200);
});
