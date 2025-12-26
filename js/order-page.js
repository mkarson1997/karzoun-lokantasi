// FILE: js/order-page.js
// الصفحة: order.html
// - زر "Siparişi Gönder" داخل السلة: يغلق السلة وينزل للفورم فقط (بعد إغلاق السلة فعلياً)
// - الفورم هو الذي ينشئ الطلب ويرسله (Supabase + Telegram function)
// - منع تحديث الصفحة + رسائل نجاح/خطأ صحيحة

import { supabase } from "./supabaseClient.js";
import { requireAuthOrRedirect, ensureProfile } from "./auth.js";
import { getCart, setCart, cartTotal, formatMoney } from "./cart.js";

const SHIP = 25;

const formEl  = document.getElementById("checkoutForm");
const sendBtn = document.getElementById("sendOrderFromCart");

const sumSub   = document.getElementById("sumSub");
const sumShip  = document.getElementById("sumShip");
const sumTotal = document.getElementById("sumTotal");

const msgOk  = document.getElementById("orderMsg");
const msgErr = document.getElementById("orderErr");

//  رسائل 
function showInlineOk(text) {
  if (msgOk) { msgOk.textContent = text; msgOk.classList.remove("d-none"); }
  if (msgErr) msgErr.classList.add("d-none");
}
function showInlineErr(text) {
  if (msgErr) { msgErr.textContent = text; msgErr.classList.remove("d-none"); }
  if (msgOk) msgOk.classList.add("d-none");
}

//  ملخص 
function updateSummary() {
  const cart = Array.isArray(getCart()) ? getCart() : [];
  const sub = cartTotal();
  const hasItems = cart.length > 0;

  if (sumSub) sumSub.textContent = formatMoney(sub);
  if (sumShip) sumShip.textContent = formatMoney(hasItems ? SHIP : 0);
  if (sumTotal) sumTotal.textContent = formatMoney(sub + (hasItems ? SHIP : 0));
}

//  Toast نجاح 
function ensureSuccessToast() {
  if (document.getElementById("orderToast")) return;

  const toast = document.createElement("div");
  toast.id = "orderToast";
  toast.className = "order-toast d-none";
  toast.innerHTML = `
    <div class="order-toast-card">
      <div class="order-toast-title"><i class="bi bi-check-circle-fill me-2"></i>Sipariş alındı</div>
      <div class="order-toast-text" id="orderToastText">Teşekkürler!</div>
      <button type="button" class="btn btn-dark btn-sm mt-2" id="orderToastOk">Tamam</button>
    </div>
  `;
  document.body.appendChild(toast);

  toast.querySelector("#orderToastOk")?.addEventListener("click", () => {
    toast.classList.add("d-none");
  });
}
function showSuccessToast(text) {
  ensureSuccessToast();
  const toast = document.getElementById("orderToast");
  const t = document.getElementById("orderToastText");
  if (t) t.textContent = text;
  toast?.classList.remove("d-none");
}

//  Offcanvas helpers 
function closeCartCanvasAndThen(cb) {
  const canvas = document.getElementById("cartCanvas");
  if (!canvas) {
    cb?.();
    return;
  }

  const bs = window.bootstrap?.Offcanvas?.getInstance?.(canvas)
    || window.bootstrap?.Offcanvas?.getOrCreateInstance?.(canvas);

  if (!canvas.classList.contains("show") || !bs) {
    cb?.();
    return;
  }

  const onHidden = () => {
    canvas.removeEventListener("hidden.bs.offcanvas", onHidden);
    setTimeout(() => cb?.(), 50);
  };

  canvas.addEventListener("hidden.bs.offcanvas", onHidden);
  bs.hide();
}

function goToDeliveryForm() {
  if (!formEl) return;

  closeCartCanvasAndThen(() => {
    formEl.scrollIntoView({ behavior: "smooth", block: "start" });
    const first = formEl.querySelector("input, textarea, select");
    first?.focus?.();
  });
}

//  قراءة الفورم 
function getFormDataFromIds() {
  return {
    full_name: (document.getElementById("custName")?.value || "").trim(),
    phone: (document.getElementById("custPhone")?.value || "").trim(),
    address: (document.getElementById("custAddress")?.value || "").trim(),
    note: (document.getElementById("custNote")?.value || "").trim(),
    payment_method: null,
  };
}

function validateForm(d) {
  if (!d.full_name) return "Lütfen ad soyad girin.";
  if (!d.phone) return "Lütfen telefon numarası girin.";
  if (!d.address) return "Lütfen adres girin.";
  return null;
}

//  Telegram عبر Supabase Edge Function 
async function sendTelegramOrder(payload) {
  try {
    const url = `${supabase.supabaseUrl}/functions/v1/telegram`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "order",
        restaurant: "KARZOUN LOKANTASI",
        ...payload
      })
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("telegram status:", res.status, "body:", text);
      throw new Error(`Telegram function failed: ${res.status} ${text}`);
    }

    try { return JSON.parse(text); } catch { return text; }
  } catch (e) {
    console.warn("telegram function failed:", e);
    return null;
  }
}



//  إنشاء الطلب 
async function createOrder() {
  msgOk?.classList.add("d-none");
  msgErr?.classList.add("d-none");

  const cart = Array.isArray(getCart()) ? getCart() : [];
  if (!cart.length) {
    showInlineErr("Sepet boş. Menüden ürün ekleyin.");
    return;
  }

  if (!formEl) {
    showInlineErr("Form bulunamadı.");
    return;
  }

  const d = getFormDataFromIds();
  const v = validateForm(d);
  if (v) {
    showInlineErr(v);
    return;
  }

  const user = await requireAuthOrRedirect("login.html");
  if (!user) return;

  await ensureProfile(user);

  const submitBtn = formEl.querySelector("button[type='submit']");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.dataset._oldHtml = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Gönderiliyor...`;
  }

  try {
    const sub = cartTotal();
    const totalWithShip = sub + SHIP;

    // A) orders
    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        total_amount: totalWithShip,
        status: "pending",
        customer_name: d.full_name,
        customer_phone: d.phone,
        customer_address: d.address,
        customer_note: d.note || null,
      })
      .select()
      .single();

    if (orderErr) throw orderErr;
    if (!order?.id) throw new Error("Sipariş ID alınamadı.");

    // B) order_items
    // ملاحظة مهمة: عندك جدول order_items كان يطلب عمود name (NOT NULL)
    // لذلك نستخدم name بدل product_name
    const items = cart.map((it) => ({
      order_id: order.id,
      product_id: it.id || it.name,
      name: it.name, // ✅ مهم
      price: Number(it.price || 0),
      qty: Number(it.qty || 1),
    }));

    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) throw itemsErr;

    // C) Telegram (اختياري)
    await sendTelegramOrder({
      order_id: order.id,
      customer: d,
      items: items.map((x) => ({ name: x.name, qty: x.qty, price: x.price })), // ✅ name
      ship: SHIP,
      total: totalWithShip,
    });

    // D) نجاح
    setCart([]);
    updateSummary();

    showInlineOk("Sipariş alındı. Teşekkürler!");
    showSuccessToast("Siparişiniz alındı. Teşekkürler!");

    setTimeout(() => {
      msgOk?.classList.add("d-none");
    }, 4500);

  } catch (e) {
    console.error("order error:", e);

    const msg =
      e?.message ||
      e?.error_description ||
      e?.details ||
      "Sipariş gönderilemedi. Lütfen tekrar deneyin.";

    showInlineErr(msg);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset._oldHtml || submitBtn.innerHTML;
      delete submitBtn.dataset._oldHtml;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateSummary();
  window.addEventListener("cart:change", updateSummary);

  if (sendBtn && !sendBtn.__bound) {
    sendBtn.__bound = true;
    sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      goToDeliveryForm();
    });
  }

  if (formEl && !formEl.__bound) {
    formEl.__bound = true;
    formEl.addEventListener("submit", async (e) => {
      e.preventDefault();
      await createOrder();
    });
  }
});
