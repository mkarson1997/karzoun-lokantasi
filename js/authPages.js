// FILE: js/authPages.js
// الهدف: منطق login/register/profile بشكل نظيف

import { supabase } from "./supabaseClient.js";
import { ensureProfile, requireAuthOrRedirect, getProfile, signOut } from "./auth.js";

const $ = (s,r=document)=>r.querySelector(s);

function setAlert(okEl, errEl, okMsg="", errMsg="") {
  if (okEl) { okEl.textContent = okMsg; okEl.classList.toggle("d-none", !okMsg); }
  if (errEl){ errEl.textContent= errMsg; errEl.classList.toggle("d-none", !errMsg); }
}

async function bindLogin() {
  const form = $("#loginForm");
  if (!form) return;

  const ok = $("#loginOk");
  const err = $("#loginErr");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(ok, err, "", "");

    const email = $("#loginEmail")?.value?.trim();
    const password = $("#loginPassword")?.value;

    const btn = form.querySelector("button[type='submit']");
    if (btn) btn.disabled = true;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // ضمان profile
      await ensureProfile(data.user);

      setAlert(ok, err, "Giriş başarılı. Yönlendiriliyor...", "");
      const back = sessionStorage.getItem("post_login_redirect") || "index.html";
      sessionStorage.removeItem("post_login_redirect");
      location.href = back;
    } catch (e) {
      setAlert(ok, err, "", (e?.message || "Giriş yapılamadı."));
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

async function bindRegister() {
  const form = $("#registerForm");
  if (!form) return;

  const ok = $("#registerOk");
  const err = $("#registerErr");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(ok, err, "", "");

    const name = $("#regName")?.value?.trim();
    const phone = $("#regPhone")?.value?.trim();
    const email = $("#regEmail")?.value?.trim();
    const password = $("#regPassword")?.value;

    const btn = form.querySelector("button[type='submit']");
    if (btn) btn.disabled = true;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, phone } } // user_metadata
      });
      if (error) throw error;

      // إذا Supabase مفعل Email confirmation: session قد تكون null
      if (data.user) {
        await ensureProfile(data.user, { full_name: name, phone });
      }

      setAlert(ok, err, "Kayıt başarılı. Giriş sayfasına yönlendiriliyor...", "");
      setTimeout(() => location.href = "login.html", 900);
    } catch (e) {
      setAlert(ok, err, "", (e?.message || "Kayıt yapılamadı."));
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}

async function bindProfile() {
  const form = $("#profileForm");
  if (!form) return;

  const ok = $("#profileOk");
  const err = $("#profileErr");

  const user = await requireAuthOrRedirect("login.html");
  if (!user) return;

  // load
  const prof = await getProfile(user.id);
  $("#profEmail") && ($("#profEmail").value = user.email || "");
  $("#profName") && ($("#profName").value = prof?.full_name || user.user_metadata?.full_name || "");
  $("#profPhone") && ($("#profPhone").value = prof?.phone || user.user_metadata?.phone || "");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setAlert(ok, err, "", "");

    const full_name = $("#profName")?.value?.trim() || null;
    const phone = $("#profPhone")?.value?.trim() || null;

    const btn = form.querySelector("button[type='submit']");
    if (btn) btn.disabled = true;

    try {
      // update profiles table
      const { error: pErr } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name,
        phone,
        updated_at: new Date().toISOString()
      }, { onConflict: "id" });
      if (pErr) throw pErr;

      // update auth metadata (اختياري)
      await supabase.auth.updateUser({ data: { full_name, phone } });

      setAlert(ok, err, "Profil güncellendi.", "");
    } catch (e) {
      setAlert(ok, err, "", (e?.message || "Profil güncellenemedi."));
    } finally {
      if (btn) btn.disabled = false;
    }
  });

  $("#logoutBtn")?.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindLogin();
  bindRegister();
  bindProfile();
});
