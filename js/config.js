// FILE: js/config.js
// الهدف: وضع إعدادات Supabase هنا (Public) بدل نشرها ضمن كل ملف

// ⚠️ مهم: الـ anon key "public" لكن لازم يكون كامل (بدون ...).
export const SUPABASE_URL = "https://xyuabdeuqkrynvrywhsm.supabase.co"; // رابط مشروع Supabase
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5dWFiZGV1cWtyeW52cnl3aHNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MzQ3MTAsImV4cCI6MjA4MjAxMDcxMH0.dVwvjMpUIlTFOERDIHa7RGPsX1_dYy03VC9LWpQN5QI"; // ضع anon key الكامل هنا

// Supabase Edge Functions endpoints
export const FN_ASSISTANT = `${SUPABASE_URL}/functions/v1/assistant`; // شات المساعد
export const FN_TELEGRAM  = `${SUPABASE_URL}/functions/v1/telegram`;  // إشعار تلجرام (طلب/رسالة)
