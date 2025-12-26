// FILE: js/layout.js
// الهدف: حقن navbar + footer تلقائياً إذا غير موجودين (خاصة صفحات login/register/profile)

function navbarHtml(active = "") {
  const is = (k) => (active === k ? "active" : "");
  return `
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top nav-glass">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center gap-2" href="index.html">
        <img src="images/logo.png" alt="Logo" width="34" height="34" class="rounded-2">
        <span>KARZOUN LOKANTASI</span>
      </a>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menuNav" aria-controls="menuNav" aria-expanded="false">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="menuNav">
        <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-2">
          <li class="nav-item"><a class="nav-link ${is("index")}" href="index.html">Anasayfa</a></li>
          <li class="nav-item"><a class="nav-link ${is("menu")}" href="menu.html">Menü</a></li>
          <li class="nav-item"><a class="nav-link ${is("about")}" href="about.html">Hakkımızda</a></li>
          <li class="nav-item"><a class="nav-link ${is("order")}" href="order.html">Sipariş</a></li>
          <li class="nav-item"><a class="nav-link ${is("contact")}" href="contact.html">İletişim</a></li>

          <!-- Auth Area -->
          <li class="nav-item" id="navGuest"><a class="nav-link" href="login.html">Giriş Yap</a></li>
          <li class="nav-item" id="navGuest2"><a class="nav-link" href="register.html">Kayıt Ol</a></li>

          <li class="nav-item dropdown d-none" id="navUser">
            <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="bi bi-person-circle me-1"></i>
              <span id="navUserName">Hesabım</span>
            </a>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="profile.html"><i class="bi bi-gear me-2"></i>Ayarlar / Profil</a></li>
              <li><a class="dropdown-item" href="orders.html"><i class="bi bi-receipt me-2"></i>Siparişlerim</a></li>
              <li><hr class="dropdown-divider"></li>
              <li><button class="dropdown-item text-danger" id="logoutBtn" type="button"><i class="bi bi-box-arrow-right me-2"></i>Çıkış</button></li>
            </ul>
          </li>

        </ul>
      </div>
    </div>
  </nav>`;
}

function footerHtml() {
  return `
  <footer class="site-footer mt-5">
    <div class="container py-5">
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="d-flex align-items-center gap-2 mb-2">
            <img src="images/logo.png" alt="Logo" width="38" height="38" class="rounded-2">
            <div class="fw-bold text-white">KARZOUN LOKANTASI</div>
          </div>
          <p class="text-white-50 mb-3">Gerçek Suriye mutfağı. Lezzet, hijyen, hızlı servis.</p>
          <div class="d-flex gap-2">
            <a class="footer-icon" href="https://www.instagram.com/mahmoud__karazon/" target="_blank" rel="noopener noreferrer"><i class="bi bi-instagram"></i></a>
            <a class="footer-icon" href="https://www.tiktok.com/@mahmoudka97" target="_blank" rel="noopener noreferrer"><i class="bi bi-tiktok"></i></a>
            <a class="footer-icon" href="https://www.youtube.com/@Karzoun-Media-Lab" target="_blank" rel="noopener noreferrer"><i class="bi bi-youtube"></i></a>
            <a class="footer-icon" href="https://wa.me/905538606094" target="_blank" rel="noopener noreferrer"><i class="bi bi-whatsapp"></i></a>
          </div>
        </div>

        <div class="col-lg-2 col-6">
          <div class="footer-title">Sayfalar</div>
          <ul class="footer-links">
            <li><a href="index.html">Anasayfa</a></li>
            <li><a href="menu.html">Menü</a></li>
            <li><a href="about.html">Hakkımızda</a></li>
            <li><a href="order.html">Sipariş</a></li>
            <li><a href="contact.html">İletişim</a></li>
          </ul>
        </div>

        <div class="col-lg-3 col-6">
          <div class="footer-title">Çalışma</div>
          <ul class="footer-links">
            <li><span class="text-white-50">Her gün:</span> 10:00 – 23:30</li>
            <li><span class="text-white-50">Adres:</span> Konya / Merkez</li>
          </ul>
        </div>

        <div class="col-lg-3">
          <div class="footer-title">Hızlı İletişim</div>
          <div class="text-white-50 mb-2"><i class="bi bi-telephone me-2"></i>+90 553 860 60 94</div>
          <div class="text-white-50 mb-3"><i class="bi bi-envelope me-2"></i>mkarson1997@gmail.com</div>
          <a href="order.html" class="btn btn-warning w-100 btn-press"><i class="bi bi-bag-check me-1"></i>Hemen Sipariş</a>
        </div>
      </div>

      <hr class="border-secondary my-4">

      <div class="footer-bottom-row text-white-50">
        <div>© 2025 KARZOUN LOKANTASI</div>
        <div class="legal-links">
          <a class="text-white-50 text-decoration-none" href="gizlilik.html">Gizlilik</a> •
          <a class="text-white-50 text-decoration-none" href="kosullar.html">Koşullar</a>
        </div>
      </div>
    </div>
  </footer>`;
}

function detectActivePage() {
  const file = (location.pathname.split("/").pop() || "index.html").toLowerCase();

  if (file.includes("menu")) return "menu";
  if (file.includes("about")) return "about";
  if (file.includes("order")) return "order";
  if (file.includes("contact")) return "contact";

  // صفحات الحساب: لا تفعّل الرئيسية (إما null أو "auth")
  if (file.includes("login") || file.includes("register") || file.includes("profile") || file.includes("orders")) {
    return ""; // ما يغمّق شي
  }

  // صفحات قانونية: لا تفعّل الرئيسية
  if (file.includes("gizlilik") || file.includes("kosullar")) {
    return ""; // ما يغمّق شي
  }

  return "index";
}


export function ensureLayout() {
  const active = detectActivePage();

  // القائمة العلوية
  if (!document.querySelector("nav.navbar")) {
    document.body.insertAdjacentHTML("afterbegin", navbarHtml(active));
    // لأن navbar fixed-top: نضيف مساحة بسيطة إن كانت الصفحة بدون hero
    document.body.style.paddingTop = "70px";
  }

  // الفوتر السفلي
  if (!document.querySelector("footer.site-footer")) {
    document.body.insertAdjacentHTML("beforeend", footerHtml());
  }
}

document.addEventListener("DOMContentLoaded", ensureLayout);
