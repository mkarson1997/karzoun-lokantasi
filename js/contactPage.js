// FILE: js/contactPage.js
// الهدف: إرسال رسالة التواصل لتلجرام عبر Edge Function (بدون كشف التوكن)

import { sendTelegram } from "./telegramClient.js";

const $ = (s, r=document)=>r.querySelector(s);

function esc(str){
  return String(str||"").replaceAll("<","").replaceAll(">","").trim();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#contactForm");
  if (!form) return;

  const ok  = $("#contactMsg");
  const err = $("#contactErr");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    ok?.classList.add("d-none");
    err?.classList.add("d-none");

    const name = esc($("#contactName")?.value);
    const phone = esc($("#contactPhone")?.value);
    const email = esc($("#contactEmail")?.value);
    const subject = esc($("#contactSubject")?.value);
    const message = esc($("#contactMsgText")?.value);

    const btn = form.querySelector("button[type='submit']");
    if (btn) btn.disabled = true;

    try {
      await sendTelegram({
        type: "contact",
        restaurant: "KARZOUN LOKANTASI",
        name, phone, email, subject, message
      });
      ok?.classList.remove("d-none");
      form.reset();
    } catch (e) {
      console.error(e);
      err?.classList.remove("d-none");
    } finally {
      if (btn) btn.disabled = false;
    }
  });
});
