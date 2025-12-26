// FILE: js/supabaseClient.js
// الهدف: إنشاء عميل Supabase واحد يُستخدم بكل الصفحات

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,      // تخزين الجلسة بالمتصفح
    autoRefreshToken: true,    // تحديث التوكن تلقائياً
    detectSessionInUrl: true,  // مهم لـ OAuth أو magic link إن استخدمته
  }
});
