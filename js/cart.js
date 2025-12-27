// FILE: js/cart.js
// الهدف: سلة واحدة لكل الصفحات (menu + order) مع localStorage ثابت

const CART_KEY = "karzoun_cart_v1"; // مفتاح ثابت للسلة

function safeJsonParse(v, fallback) {
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function getCart() {
  return safeJsonParse(localStorage.getItem(CART_KEY), []);
}

export function setCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items || []));
  window.dispatchEvent(new CustomEvent("cart:change", { detail: getCart() })); // حدث لتحديث الواجهة
}

export function clearCart() {
  setCart([]);
}

export function addItem(item) {
  const cart = getCart();
  const id = item.id || item.name; // id بسيط
  const idx = cart.findIndex(x => (x.id || x.name) === id);
  if (idx >= 0) {
    cart[idx].qty = (cart[idx].qty || 1) + (item.qty || 1);
  } else {
    cart.push({
      id,
      name: item.name,
      price: Number(item.price || 0),
      img: item.img || null,
      qty: Number(item.qty || 1),
    });
  }
  setCart(cart);
}

export function removeItem(id) {
  const cart = getCart().filter(x => (x.id || x.name) !== id);
  setCart(cart);
}

export function updateQty(id, qty) {
  const cart = getCart();
  const it = cart.find(x => (x.id || x.name) === id);
  if (!it) return;
  it.qty = Math.max(1, Number(qty || 1));
  setCart(cart);
}

export function cartTotal() {
  const cart = getCart();
  if (!Array.isArray(cart)) return 0;
  return cart.reduce((s, x) => s + (Number(x.price)||0) * (Number(x.qty)||1), 0);
}

// تنسيق السعر بشكل بسيط (واجهة تركية)
export function formatMoney(v) {
  const n = Number(v || 0);
  try {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(n);
  } catch {
    return `₺${n.toFixed(2)}`;
  }
}

// ربط أزرار "Sepete Ekle" في أي صفحة
// لازم الزر يحمل data-add-to-cart + بيانات المنتج بالـ dataset
export function bindAddToCartButtons(root = document) {
  if (!root) root = document;

  // ✅ Delegation: اربط مرة واحدة فقط على الـ root (الأفضل document)
  if (root.__cartDelegated) return;
  root.__cartDelegated = true;

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-to-cart], .add-to-cart");
    if (!btn) return;

    // إذا الزر داخل رابط أو في عناصر ممكن تعمل Navigation، امنعها
    e.preventDefault();

    const item = {
      id: btn.dataset.id || btn.dataset.name || btn.dataset.item,
      name: btn.dataset.name || btn.dataset.item || "Ürün",
      price: Number(btn.dataset.price || 0),
      img: btn.dataset.img || btn.closest(".card")?.querySelector("img")?.getAttribute("src") || null,
      qty: 1
    };

    addItem(item);

    try { animateFlyToCart(btn); } catch {}
  }, { passive: false });
}


// تأثير: صورة/نقطة تطير باتجاه زر السلة
function animateFlyToCart(btn) {
  const cartBtn = document.querySelector("[data-cart-btn]");
  if (!cartBtn) return;

  // نأخذ صورة المنتج أو الكارد إن وجد (أفضل من نقطة فقط)
  const card = btn.closest(".card, .menu-card, .product-card") || btn.closest("section") || btn;
  const img = card?.querySelector?.("img");

  const from = (img || btn).getBoundingClientRect();
  const to = cartBtn.getBoundingClientRect();

  const ghost = (img ? img.cloneNode(true) : card.cloneNode(true));
  ghost.classList.add("fly-ghost");
  ghost.style.width = Math.min(from.width, 220) + "px";
  ghost.style.height = (img ? "auto" : Math.min(from.height, 160) + "px");
  ghost.style.left = from.left + "px";
  ghost.style.top = from.top + "px";
  ghost.style.position = "fixed";
  ghost.style.margin = "0";
  ghost.style.zIndex = "99999";
  ghost.style.borderRadius = "14px";
  ghost.style.pointerEvents = "none";
  ghost.style.boxShadow = "0 18px 45px rgba(0,0,0,.35)";
  ghost.style.objectFit = "cover";
  ghost.style.background = "#fff";

  document.body.appendChild(ghost);

  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);

  ghost.animate(
    [
      { transform: "translate(0,0) scale(1)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.15 }
    ],
    { duration: 700, easing: "cubic-bezier(.2,1,.2,1)" }
  ).onfinish = () => ghost.remove();
}
