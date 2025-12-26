// FILE: js/nav-auth.js
// الهدف: تبديل عناصر القائمة حسب حالة تسجيل الدخول + اسم المستخدم + زر خروج

import { supabase } from "./supabaseClient.js";
import { getUser, ensureProfile, getProfile, signOut } from "./auth.js";

function $(sel, root=document){ return root.querySelector(sel); }

function setText(el, text){ if (el) el.textContent = text; }

async function refreshNav() {
  const user = await getUser();

  const navGuest  = $("#navGuest");
  const navGuest2 = $("#navGuest2");
  const navUser   = $("#navUser");
  const navUserName = $("#navUserName");

  if (!navGuest || !navGuest2 || !navUser) return; // navbar غير موجود في هذه الصفحة

  if (!user) {
    navGuest.classList.remove("d-none");
    navGuest2.classList.remove("d-none");
    navUser.classList.add("d-none");
    return;
  }

  // تأكد profile موجود (لـ FK + اسم المستخدم)
  await ensureProfile(user);

  const prof = await getProfile(user.id);
  const displayName =
    (prof && (prof.full_name || prof.name)) ||
    (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) ||
    (user.email ? user.email.split("@")[0] : "Hesabım");

  setText(navUserName, displayName);

  navGuest.classList.add("d-none");
  navGuest2.classList.add("d-none");
  navUser.classList.remove("d-none");

  // زر خروج
  const logoutBtn = $("#logoutBtn");
  if (logoutBtn && !logoutBtn.__bound) {
    logoutBtn.__bound = true;
    logoutBtn.addEventListener("click", async () => {
      await signOut();
    });
  }
}

document.addEventListener("DOMContentLoaded", refreshNav);

// تحديث تلقائي عند تغيير حالة الجلسة
supabase.auth.onAuthStateChange((_evt, _session) => {
  refreshNav();
});
