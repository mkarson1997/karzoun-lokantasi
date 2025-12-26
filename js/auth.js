// FILE: js/auth.js
// الهدف: توحيد منطق تسجيل الدخول + جلب المستخدم + إنشاء profile إن لم يوجد

import { supabase } from "./supabaseClient.js";

// جلب المستخدم الحالي (أو null)
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

// تأكد أن المستخدم مسجّل دخول، وإلا حوله لصفحة login
export async function requireAuthOrRedirect(redirectTo = "login.html") {
  const user = await getUser();
  if (!user) {
    // حفظ الصفحة الحالية للرجوع بعد تسجيل الدخول
    const here = location.pathname.split("/").pop() || "index.html";
    sessionStorage.setItem("post_login_redirect", here);
    location.href = redirectTo;
    return null;
  }
  return user;
}

// إنشاء/ضمان وجود صف في profiles بنفس id المستخدم
export async function ensureProfile(user, extras = {}) {
  if (!user?.id) return null;

  // نحاول نجلب profile
  const { data: prof, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // إذا الجدول غير موجود أو RLS مانع القراءة، نرجّع null بدون كسر
  if (pErr && !String(pErr.message || "").toLowerCase().includes("does not exist")) {
    // لا نرمي خطأ هنا لأن الموقع لازم يكمل
    console.warn("profiles select error:", pErr);
  }

  if (prof) return prof;

  // إذا ما في profile، ننشئ واحد (هذا يحل FK orders_user_id_fkey إذا كان يربط لـ profiles)
  const payload = {
    id: user.id,
    email: user.email || null,
    full_name: (user.user_metadata && (user.user_metadata.full_name || user.user_metadata.name)) || null,
    phone: (user.user_metadata && user.user_metadata.phone) || null,
    created_at: new Date().toISOString(),
    ...extras
  };

  const { data: inserted, error: iErr } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .maybeSingle();

  if (iErr) {
    console.warn("profiles upsert error:", iErr);
    return null;
  }
  return inserted || null;
}

// جلب profile (إن وجد)
export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    console.warn("getProfile error:", error);
    return null;
  }
  return data || null;
}

// تسجيل خروج
export async function signOut() {
  await supabase.auth.signOut();
  // تنظيف أي بيانات محلية إضافية إن لزم
  location.href = "index.html";
}
