// FILE: js/telegramClient.js
// الهدف: إرسال رسالة لتلجرام عبر Supabase Edge Function بدون كشف التوكن

import { FN_TELEGRAM, SUPABASE_ANON_KEY } from "./config.js";

export async function sendTelegram(payload) {
  const res = await fetch(FN_TELEGRAM, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
