// FILE: js/app.js (UPDATED)
//  يشتغل بكل الصفحات: خلفية + مساعد + سلة + إغلاق منيو الموبايل

import { FN_ASSISTANT, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config.js";
import { bindAddToCartButtons, getCart, setCart, cartTotal, formatMoney } from "./cart.js";

//  مساعدات صغيرة 
const $ = (sel, root = document) => root.querySelector(sel);
//  1) الكانفس المتعلق بخلفية موقع المطعم كامل الصفحة
function ensureGlobalBackground() {
  if ($(".site-bg-canvas")) return;

  const c = document.createElement("canvas");
  c.className = "site-bg-canvas";
  c.setAttribute("aria-hidden", "true");
  document.body.prepend(c);

  initRestaurantBackground(c);
}

function initRestaurantBackground(canvas) {
  const ctx = canvas.getContext("2d");
  let w = 0, h = 0, t = 0;

  const blobs = [];
  const BLOB_COUNT = 16;

  const ripples = [];
  let lastRippleAt = 0;
  const RIPPLE_GAP_MS = 35;

  const foods = [];
  const FOOD_COUNT = 18;
  const FOOD_EMOJIS = ["🥙", "🧆", "🌯", "🍢"];

  const mouse = { x: 0, y: 0, tx: 0, ty: 0, speed: 0 };

  const rand = (min, max) => Math.random() * (max - min) + min;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function resetSize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function createBlobs() {
    blobs.length = 0;
    for (let i = 0; i < BLOB_COUNT; i++) {
      const r = rand(Math.min(w, h) * 0.05, Math.min(w, h) * 0.14);
      blobs.push({ x: rand(0, w), y: rand(0, h), r, vx: rand(-0.25, 0.25), vy: rand(-0.18, 0.18), a: rand(0.05, 0.12) });
    }
  }

  function createFoods() {
    foods.length = 0;
    for (let i = 0; i < FOOD_COUNT; i++) {
      const size = rand(18, 44);
      foods.push({
        emoji: FOOD_EMOJIS[Math.floor(rand(0, FOOD_EMOJIS.length))],
        x: rand(0, w), y: rand(0, h),
        vx: rand(-0.25, 0.25), vy: rand(-0.35, -0.10),
        rot: rand(0, Math.PI * 2), vr: rand(-0.015, 0.015),
        size, wob: rand(0.8, 1.6), phase: rand(0, Math.PI * 2), a: rand(0.22, 0.55),
      });
    }
  }

  function spawnRipple(x, y, speed) {
    const power = clamp(speed / 22, 0.6, 2.2);
    ripples.push({ x, y, r: 0, a: 0.28 * power, w: 2.2 * power, grow: 5.5 * power, fade: 0.0065 * (1 / power) });
    if (ripples.length > 60) ripples.shift();
  }

  function drawAnimatedGradient() {
    const x1 = (Math.sin(t * 0.00035) * 0.35 + 0.5) * w;
    const y1 = (Math.cos(t * 0.00030) * 0.35 + 0.5) * h;
    const x2 = (Math.cos(t * 0.00032) * 0.40 + 0.5) * w;
    const y2 = (Math.sin(t * 0.00028) * 0.40 + 0.5) * h;

    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0.00, "rgba(28, 12, 8, 1)");
    g.addColorStop(0.35, "rgba(92, 30, 16, 1)");
    g.addColorStop(0.70, "rgba(160, 85, 20, 1)");
    g.addColorStop(1.00, "rgba(18, 10, 10, 1)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  function drawBokeh() {
    for (const b of blobs) {
      b.x += b.vx; b.y += b.vy;
      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h + b.r;
      if (b.y > h + b.r) b.y = -b.r;

      const gg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      gg.addColorStop(0, `rgba(255, 193, 7, ${b.a})`);
      gg.addColorStop(0.55, `rgba(255, 255, 255, ${b.a * 0.30})`);
      gg.addColorStop(1, "rgba(255,255,255,0)");

      ctx.fillStyle = gg;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRipples() {
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += r.grow;
      r.a -= r.fade;

      const gg = ctx.createRadialGradient(r.x, r.y, r.r * 0.2, r.x, r.y, r.r);
      gg.addColorStop(0, `rgba(255, 193, 7, 0)`);
      gg.addColorStop(0.55, `rgba(255, 193, 7, ${r.a})`);
      gg.addColorStop(1, `rgba(255, 255, 255, ${r.a * 0.12})`);

      ctx.strokeStyle = gg;
      ctx.lineWidth = r.w;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();

      if (r.a <= 0) ripples.splice(i, 1);
    }
  }

  function drawFoods() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const f of foods) {
      f.phase += 0.012;
      f.x += f.vx + Math.sin(f.phase) * 0.12 * f.wob;
      f.y += f.vy + Math.cos(f.phase * 0.9) * 0.10 * f.wob;
      f.rot += f.vr;

      if (f.y < -80) { f.y = h + 80; f.x = rand(0, w); }
      if (f.x < -80) f.x = w + 80;
      if (f.x > w + 80) f.x = -80;

      ctx.globalAlpha = f.a;
      ctx.font = `${f.size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.fillText(f.emoji, 0, 0);
      ctx.rotate(-f.rot);
      ctx.translate(-f.x, -f.y);
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawVignette() {
    const gg = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.18, w * 0.5, h * 0.5, Math.min(w, h) * 0.75);
    gg.addColorStop(0, "rgba(0,0,0,0)");
    gg.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = gg;
    ctx.fillRect(0, 0, w, h);
  }

  function step(ts) {
    t = ts;

    ctx.clearRect(0, 0, w, h);
    drawAnimatedGradient();
    drawBokeh();
    drawFoods();
    drawRipples();
    drawVignette();

    requestAnimationFrame(step);
  }

  resetSize();
  createBlobs();
  createFoods();

  window.addEventListener("click", (e) => {
    for (let k = 0; k < 3; k++) spawnRipple(e.clientX, e.clientY, 45 + k * 10);
  }, { passive: true });

  window.addEventListener("resize", () => { resetSize(); createBlobs(); createFoods(); }, { passive: true });

  requestAnimationFrame(step);
}

//  2) اعدادات القائمة في الهاتف افتح اغلق
function enableMobileNavAutoClose() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;

  const collapseEl = nav.querySelector(".navbar-collapse");
  const toggler = nav.querySelector(".navbar-toggler");
  if (!collapseEl || !toggler) return;

  const bsCollapse = window.bootstrap?.Collapse?.getOrCreateInstance?.(collapseEl, { toggle: false });
  if (!bsCollapse) return;

  nav.addEventListener("click", (e) => {
    const link = e.target.closest("a.nav-link, a.dropdown-item, a.btn, button.dropdown-toggle");
    if (!link) return;

    if (link.classList?.contains("dropdown-toggle") || link.getAttribute?.("data-bs-toggle") === "dropdown") return;

    const isMobile = getComputedStyle(toggler).display !== "none";
    if (!isMobile) return;

    if (collapseEl.classList.contains("show")) bsCollapse.hide();
  });
}

//  3) ف ا ب كبست سلة التسوق الكرت 
function ensureCartFab() {
  if (document.querySelector(".cart-fab")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cart-fab";
  btn.setAttribute("aria-label", "Sepet");
  btn.setAttribute("data-cart-btn", "1");
  btn.innerHTML = `
    <i class="bi bi-bag"></i>
    <span class="cart-badge d-none" data-cart-count-fab>0</span>
  `;
  document.body.appendChild(btn);

  btn.addEventListener("click", () => {
    const canvas = document.getElementById("cartCanvas");

    if (!canvas) {
      window.location.href = "order.html";
      return;
    }

    const bs = window.bootstrap?.Offcanvas?.getOrCreateInstance(canvas);
    bs?.show();
  });
}

function updateCartBadge() {
  const cart = getCart() || [];
  const count = Array.isArray(cart) ? cart.reduce((s, x) => s + (Number(x.qty)||1), 0) : 0;

  const fab = document.querySelector("[data-cart-count-fab]");
  if (fab) {
    fab.textContent = String(count);
    fab.classList.toggle("d-none", count <= 0);
  }
}

window.addEventListener("cart:change", updateCartBadge);

//  3.1) اوف كانفس كارت تأثير للسلة في صفة الطلبات للسلة (داخل order.html فقط) 
function initCartCanvas() {
  const canvas = document.getElementById("cartCanvas");
  if (!canvas) return;

  const listEl = canvas.querySelector("#cartItemsCanvas");
  const subEl  = canvas.querySelector("#cartSub");
  const totalEl = canvas.querySelector("#cartTotal");
  const clearBtn = canvas.querySelector("#clearCart");
  const checkoutBtn = canvas.querySelector('[data-action="checkout"], #sendOrderFromCart');

  const SHIP = 25;

  function render() {
    const cart = getCart();
    if (!listEl) return;
    const cartArray = Array.isArray(cart) ? cart : [];

    listEl.innerHTML = "";
    if (!cartArray.length) {
      listEl.innerHTML = `<div class="text-muted">Sepet boş.</div>`;
    } else {
      cartArray.forEach((it) => {
        const row = document.createElement("div");
        row.className = "d-flex align-items-center justify-content-between py-2 border-bottom";

        const left = document.createElement("div");
        left.innerHTML = `
          <div class="fw-semibold">${it.name}</div>
          <div class="small text-muted">${it.qty} × ${formatMoney(it.price)}</div>
        `;

        const right = document.createElement("div");
        right.className = "d-flex align-items-center gap-2";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.className = "btn btn-sm btn-outline-dark";
        minus.textContent = "-";
        minus.addEventListener("click", () => {
          const c = Array.isArray(getCart()) ? getCart() : [];
          const i = c.findIndex(x => (x.id || x.name) === (it.id || it.name));
          if (i < 0) return;
          c[i].qty = Math.max(0, (Number(c[i].qty) || 1) - 1);
          if (c[i].qty === 0) c.splice(i, 1);
          setCart(c);
          render();
        });

        const plus = document.createElement("button");
        plus.type = "button";
        plus.className = "btn btn-sm btn-outline-dark";
        plus.textContent = "+";
        plus.addEventListener("click", () => {
          const c = Array.isArray(getCart()) ? getCart() : [];
          const i = c.findIndex(x => (x.id || x.name) === (it.id || it.name));
          if (i < 0) return;
          c[i].qty = (Number(c[i].qty) || 1) + 1;
          setCart(c);
          render();
        });

        const lineTotal = document.createElement("div");
        lineTotal.className = "fw-semibold";
        lineTotal.textContent = formatMoney((Number(it.price) || 0) * (Number(it.qty) || 1));

        right.append(minus, plus, lineTotal);
        row.append(left, right);
        listEl.appendChild(row);
      });
    }

    const sub = cartTotal();
    if (subEl) subEl.textContent = formatMoney(sub);
    if (totalEl) totalEl.textContent = formatMoney(sub + (cartArray.length ? SHIP : 0));
  }

  // زر تنظيف
  if (clearBtn && !clearBtn.__bound) {
    clearBtn.__bound = true;
    clearBtn.addEventListener("click", () => {
      setCart([]);
      render();
    });
  }

  // زر إرسال الطلبية داخل السلة: يغلق السلة وينزل على Teslimat Bilgileri
  if (checkoutBtn && !checkoutBtn.__bound) {
    checkoutBtn.__bound = true;
    checkoutBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const cart = Array.isArray(getCart()) ? getCart() : [];
      if (!cart.length) return;

      // أغلق offcanvas
      const bs = window.bootstrap?.Offcanvas?.getOrCreateInstance(canvas);
      bs?.hide();

      // انزل على قسم تسليمات بيلجيلار
      setTimeout(() => {
        const delivery = document.getElementById("deliveryPanel");
        delivery?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    });
  }

  window.addEventListener("cart:change", render);
  render();
}

//  4) مساعد (OpenAI عبر Supabase Edge Function) اعدادات الطرابط والواجهة
function ensureAssistant() {
  if (document.querySelector(".site-assistant")) return;

  const wrap = document.createElement("div");
  wrap.className = "site-assistant";

  wrap.innerHTML = `
    <div class="assistant-fab" title="Yardım">
      <i class="bi bi-chat-dots-fill fs-4"></i>
    </div>

    <div class="assistant-card">
      <div class="assistant-head">
        <span>KARZOUN Asistan</span>
        <button class="assistant-close" type="button">&times;</button>
      </div>

      <div class="assistant-body">
        <div class="assistant-msgs" style="max-height:220px;overflow-y:auto;font-size:1rem;">
          <div class="assistant-msg assistant-msg-bot">Merhaba! Size nasıl yardımcı olabilirim?</div>
        </div>
        <form class="assistant-chatbox d-flex gap-2 mt-2">
          <input type="text" class="form-control form-control-sm" placeholder="Mesajınızı yazın..." required style="flex:1;">
          <button class="btn btn-warning btn-sm" type="submit"><i class="bi bi-send"></i></button>
        </form>
        <div class="assistant-actions mt-2">
          <button type="button" data-go="menu">🍽 Menü</button>
          <button type="button" data-go="order">🛒 Sipariş</button>
          <button type="button" data-go="contact">📞 İletişim</button>
          <button type="button" data-go="maps">📍 Harita</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(wrap);

  const fab = wrap.querySelector(".assistant-fab");
  const close = wrap.querySelector(".assistant-close");
  const buttons = wrap.querySelectorAll("[data-go]");
  const chatForm = wrap.querySelector(".assistant-chatbox");
  const chatInput = chatForm.querySelector("input");
  const chatMsgs = wrap.querySelector(".assistant-msgs");

  const toggle = (open) => wrap.classList.toggle("open", open);

  fab.addEventListener("click", () => {
    toggle(!wrap.classList.contains("open"));
    if (wrap.classList.contains("open")) chatInput.focus();
  });

  close.addEventListener("click", () => toggle(false));

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) toggle(false);
  });

  buttons.forEach(b => {
    b.addEventListener("click", () => {
      const go = b.dataset.go;
      if (go === "menu") location.href = "menu.html";
      if (go === "order") location.href = "order.html";
      if (go === "contact") location.href = "contact.html";
      if (go === "maps") window.open("https://www.google.com/maps?q=37.8746,32.4932", "_blank", "noopener");
      toggle(false);
    });
  });

  // سياق محادثة بسيط (نخزّنه بالجلسة)
  const HISTORY_KEY = "karzoun_assistant_history_v1";
  const history = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || "[]");

  async function callAssistant(userText) {
    const res = await fetch(FN_ASSISTANT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        message: userText,
        history: history.slice(-10)
      })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return String(data.reply || "").trim();
  }

  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;

    const userDiv = document.createElement("div");
    userDiv.className = "assistant-msg assistant-msg-user text-end";
    userDiv.textContent = userMsg;
    chatMsgs.appendChild(userDiv);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
    chatInput.value = "";

    const waitDiv = document.createElement("div");
    waitDiv.className = "assistant-msg assistant-msg-bot";
    waitDiv.textContent = "Yanıt yazılıyor...";
    chatMsgs.appendChild(waitDiv);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;

    try {
      const reply = await callAssistant(userMsg);
      waitDiv.textContent = reply || "Üzgünüz, yanıt alınamadı.";
      history.push({ role: "user", content: userMsg });
      history.push({ role: "assistant", content: reply });
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.error("assistant error:", err);
      waitDiv.textContent = "Üzgünüz، şu anda yanıt verilemiyor.";
    }
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  });
}

//  تشغيل الاعدادات عند تحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
  ensureGlobalBackground();
  ensureAssistant();
  ensureCartFab();
  initCartCanvas();

  bindAddToCartButtons(document);
  updateCartBadge();
  enableMobileNavAutoClose();

  // إذا جاي من رابط فيه #delivery، نزل للقسم
  if (location.hash === "#delivery") {
    const delivery = document.getElementById("deliveryPanel");
    delivery?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
});
